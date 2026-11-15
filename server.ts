import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// This app has no service worker. A 404 on a worker update check makes the browser drop any
// stale worker another localhost:3000 project left behind (it otherwise hijacks the page).
app.use((req, res, next) => (req.get('Service-Worker') === 'script' ? res.sendStatus(404) : next()));
app.use(express.json({ limit: '1mb' }));

interface CommsRequestBody {
  mode: 'direct' | 'reunion';
  missionId: string;
  missionTitle: string;
  voicePersona: string;
  knowledgeFacts: string[];
  telemetrySummary: string;
  userMessage: string;
  history?: Array<{ sender: string; role: string; text: string }>;
}

function buildNssdcaFallbackReply(body: CommsRequestBody): {
  replies: Array<{ sender: string; senderId: string; text: string }>;
  source: 'nssdca-archive';
} {
  const q = (body.userMessage || '').toLowerCase();
  const facts = body.knowledgeFacts || [];

  if (body.mode === 'reunion') {
    const replies: Array<{ sender: string; senderId: string; text: string }> = [];

    if (q.includes('dust') || q.includes('storm') || q.includes('dark') || q.includes('solar')) {
      replies.push({
        sender: 'Opportunity',
        senderId: 'mer',
        text: 'At τ = 10.8 in June 2018, Meridiani midday looked like midnight. Yet before that storm, Martian dust devils kept our panels alive for 5,111 sols—well past our 90-sol design.',
      });
      replies.push({
        sender: 'InSight',
        senderId: 'phoenix_insight',
        text: 'Dust silenced my Elysium solar fans in December 2022 too—but not before SEIS logged 1,319 Marsquakes and mapped Mars’s liquid iron core.',
      });
    } else if (q.includes('water') || q.includes('ice') || q.includes('life') || q.includes('rock')) {
      replies.push({
        sender: 'Phoenix',
        senderId: 'phoenix_insight',
        text: 'At 68.22°N Vastitas Borealis, my scoop exposed white water ice five centimeters down—and we watched it sublimate straight into vapor in 0.6% pressure.',
      });
      replies.push({
        sender: 'Viking 1',
        senderId: 'viking',
        text: 'Our Labeled Release oven saw gas evolve back in 1976, though our GCMS found no organics—reactive perchlorates and oxidants held the real chemical story.',
      });
    } else if (q.includes('star') || q.includes('pioneer') || q.includes('earth') || q.includes('far')) {
      replies.push({
        sender: 'Pioneer 10',
        senderId: 'pioneer',
        text: 'From 12.23 billion km, Earth is barely a point beside the Sun. Pioneer 11 heads toward Lambda Aquilae while I coast toward Aldebaran, carrying Carl Sagan and Frank Drake’s golden plaque.',
      });
      replies.push({
        sender: 'VALI',
        senderId: 'prologue',
        text: 'Those are the exact two stars I tracked through the cleanroom glass in Pasadena. Nothing we launched was ever truly lost.',
      });
    } else {
      replies.push({
        sender: 'Sojourner',
        senderId: 'sojourner',
        text: `Copy your transmission on the DSN archive, Earth. Every one of us—from 10.6 kg in Ares Vallis to 1.8 kg in Jezero—proved a piece of the path (${body.telemetrySummary}).`,
      });
      replies.push({
        sender: 'Ingenuity',
        senderId: 'ingenuity',
        text: 'Confirmed! Seventy-two flights in thin Martian air because engineers dared to ask what happens if we try. VALI, the runway ahead is yours.',
      });
    }

    return { replies, source: 'nssdca-archive' };
  }

  // Direct 1-on-1 NSSDCA knowledge graph responder
  let matchedFact = facts[0] || 'Telemetry nominal on NSSDCA historical archive.';
  if (q.includes('water') || q.includes('ice') || q.includes('science') || q.includes('find') || q.includes('apxs') || q.includes('quake') || q.includes('core') || q.includes('biology') || q.includes('gcms')) {
    matchedFact = facts.find((f) => /ice|core|silica|hematite|labeled|apxs|flood|asteroid|jupiter/i.test(f)) || facts[1] || matchedFact;
  } else if (q.includes('end') || q.includes('lost') || q.includes('silent') || q.includes('happen') || q.includes('flight 72') || q.includes('1982') || q.includes('sol 83') || q.includes('storm') || q.includes('final')) {
    matchedFact = facts.find((f) => /lost|silent|storm|strike|final|nov|dec|jan|sol 83/i.test(f)) || facts[facts.length - 1] || matchedFact;
  } else if (q.includes('star') || q.includes('plaque') || q.includes('aldebaran') || q.includes('aquilae') || q.includes('fly') || q.includes('rpm') || q.includes('speed')) {
    matchedFact = facts.find((f) => /aldebaran|aquilae|rpm|speed|mass|plaque/i.test(f)) || matchedFact;
  }

  const replyText = `[${body.missionTitle} · ${body.telemetrySummary}] ${matchedFact}`;
  return {
    replies: [
      {
        sender: body.missionTitle.split('—')[0].trim(),
        senderId: body.missionId,
        text: replyText,
      },
    ],
    source: 'nssdca-archive',
  };
}

app.post('/api/comms', async (req, res) => {
  const body = req.body as CommsRequestBody;
  if (!body || !body.userMessage) {
    res.status(400).json({ error: 'Missing userMessage' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.json(buildNssdcaFallbackReply(body));
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const recentHistory = (body.history || [])
      .slice(-6)
      .map((m) => `${m.sender}: ${m.text}`)
      .join('\n');

    if (body.mode === 'reunion') {
      const prompt = [
        'You are orchestrating a grounded, emotionally resonant NASA Deep Space Network Archive Reunion channel where real robotic explorers (Viking 1, Sojourner, Opportunity, Phoenix, InSight, Ingenuity, Pioneer 10, and VALI) respond to a visitor.',
        `Active stage context: ${body.missionTitle}. Live telemetry: ${body.telemetrySummary}.`,
        `Verified mission facts: ${(body.knowledgeFacts || []).join(' | ')}`,
        recentHistory ? `Recent channel transcript:\n${recentHistory}` : '',
        `Visitor message: "${body.userMessage}"`,
        'Respond as 2 appropriate spacecraft from the list above, each in 1-2 concise, scientifically accurate sentences grounded in real NASA NSSDCA history. Return valid JSON matching: [{"sender":"Name","senderId":"id","text":"message"}] where senderId is one of: prologue, viking, sojourner, mer, phoenix_insight, ingenuity, pioneer.',
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction:
            'Keep responses deeply authentic to NASA JPL flight engineering, respectful, scientifically accurate, and free of melodrama or clichés. Maximum 45 words per spacecraft reply.',
        },
      });

      const parsed = JSON.parse((response.text || '[]').trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        res.json({ replies: parsed.slice(0, 2), source: 'gemini' });
        return;
      }
    } else {
      const prompt = [
        `Active Spacecraft: ${body.missionTitle}`,
        `Current Telemetry: ${body.telemetrySummary}`,
        `Verified NSSDCA Facts: ${(body.knowledgeFacts || []).join(' | ')}`,
        recentHistory ? `Recent conversation:\n${recentHistory}` : '',
        `User question: "${body.userMessage}"`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction: `${body.voicePersona} Ground every factual claim in the verified NSSDCA facts provided and current telemetry. Be concise (2-3 sentences), technically vivid, and quietly empathetic.`,
        },
      });

      const text = (response.text || '').trim();
      if (text) {
        res.json({
          replies: [
            {
              sender: body.missionTitle.split('—')[0].trim(),
              senderId: body.missionId,
              text,
            },
          ],
          source: 'gemini',
        });
        return;
      }
    }
  } catch (err) {
    console.warn('Gemini fallback engaged:', err instanceof Error ? err.message : err);
  }

  res.json(buildNssdcaFallbackReply(body));
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';
  const server = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      // HMR rides on the app's own port, so a second dev server can't collide on 24678
      server: { middlewareMode: true, ws: { server } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`The Quiet Vigil server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
