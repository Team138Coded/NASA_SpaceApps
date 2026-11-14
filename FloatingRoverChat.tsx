import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { ChatMessage, MissionDossier } from '../types/mission';

interface FloatingRoverChatProps {
  mission: MissionDossier;
  telemetrySummary: string;
  messages: ChatMessage[];
  onAppendMessages: (msgs: ChatMessage[]) => void;
}

export const FloatingRoverChat: React.FC<FloatingRoverChatProps> = ({
  mission,
  telemetrySummary,
  messages,
  onAppendMessages,
}) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const visibleMessages = messages.filter(
    (m) => m.mode === 'direct' && m.missionId === mission.id
  );

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleMessages.length, open, mission.id]);

  const sendMessage = async (textToSend?: string) => {
    const trimmed = (textToSend ?? input).trim();
    if (!trimmed || loading) return;

    const nowLabel = new Date().toISOString().slice(11, 16) + ' UTC';
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'You',
      senderId: 'user',
      role: 'user',
      text: trimmed,
      timestamp: nowLabel,
      mode: 'direct',
      missionId: mission.id,
    };

    onAppendMessages([userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/comms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'direct',
          missionId: mission.id,
          missionTitle: mission.title,
          voicePersona: mission.voicePersona,
          knowledgeFacts: mission.knowledgeFacts,
          telemetrySummary,
          userMessage: trimmed,
          history: visibleMessages.slice(-6).map((m) => ({
            sender: m.sender,
            role: m.role,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const replies: Array<{ sender: string; senderId: string; text: string }> =
        Array.isArray(data.replies) ? data.replies : [];

      const replyMsgs: ChatMessage[] = replies.map((r, idx) => ({
        id: `bot-${Date.now()}-${idx}`,
        sender: r.sender || mission.shortName,
        senderId: r.senderId || mission.id,
        role: 'spacecraft',
        text: r.text,
        timestamp: nowLabel,
        mode: 'direct',
        missionId: mission.id,
        source: data.source || 'nssdca-archive',
      }));

      if (replyMsgs.length > 0) {
        onAppendMessages(replyMsgs);
      }
    } catch {
      const fact =
        mission.knowledgeFacts[0] ||
        'Signal carrier locked on NSSDCA mission archive.';
      onAppendMessages([
        {
          id: `fallback-${Date.now()}`,
          sender: mission.shortName,
          senderId: mission.id,
          role: 'spacecraft',
          text: `${fact} (${telemetrySummary})`,
          timestamp: nowLabel,
          mode: 'direct',
          missionId: mission.id,
          source: 'nssdca-archive',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {/* Slide-up 1-on-1 Rover Chat Drawer */}
      {open && (
        <div
          className="w-[min(390px,calc(100vw-2.5rem))] bg-[#0C1322] border border-slate-700 rounded-lg shadow-2xl overflow-hidden flex flex-col"
          role="dialog"
          aria-label={`Chat with ${mission.shortName}`}
        >
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-[#0A101D]">
            <div>
              <div className="text-xs font-mono text-[#38BDF8] inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Direct 1-on-1 Radio Link</span>
              </div>
              <div className="text-sm font-semibold text-slate-100">
                Chat with {mission.shortName}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded border border-slate-800"
              aria-label="Close chat drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="h-[270px] overflow-y-auto p-3.5 space-y-2.5 bg-[#070B14]"
          >
            {visibleMessages.length === 0 && (
              <div className="text-xs text-slate-400 py-6 text-center leading-relaxed">
                Ask <span className="text-slate-200 font-medium">{mission.shortName}</span>{' '}
                anything about its journey, or pick one of the starter questions below.
              </div>
            )}

            {visibleMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10.5px] font-mono text-slate-400 mb-0.5">
                    <span className={isUser ? 'text-[#38BDF8]' : 'text-[#E07A5F]'}>
                      {msg.sender}
                    </span>{' '}
                    · {msg.timestamp}
                  </div>
                  <div
                    className={`max-w-[90%] px-3 py-2 rounded text-xs leading-relaxed border ${
                      isUser
                        ? 'bg-[#0C1322] border-[#38BDF8]/30 text-slate-100'
                        : 'bg-[#0C1322] border-slate-800 text-slate-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="font-mono text-xs text-[#38BDF8]">
                Receiving transmission...
              </div>
            )}
          </div>

          {/* 3 Clickable Starter Questions */}
          <div className="px-3 py-2 border-t border-slate-800 bg-[#0C1322] flex flex-wrap gap-1.5">
            {mission.suggestedPrompts.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading}
                onClick={() => sendMessage(prompt)}
                className="text-left text-[11px] px-2.5 py-1 bg-[#070B14] hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-[#38BDF8] rounded transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-2.5 border-t border-slate-800 flex items-center gap-2 bg-[#0C1322]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${mission.shortName}...`}
              className="flex-1 min-w-0 bg-[#070B14] border border-slate-700 focus:border-[#38BDF8] rounded px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-1 px-3 py-2 bg-[#38BDF8] hover:bg-sky-300 disabled:bg-slate-800 disabled:text-slate-500 text-[#070B14] font-semibold text-xs rounded transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Circular Comms Button pinned bottom-right */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#0C1322] hover:bg-[#131E36] border border-[#38BDF8]/60 text-slate-100 shadow-lg transition-colors whitespace-nowrap shrink-0"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
        </span>
        <MessageSquare className="w-4 h-4 text-[#38BDF8]" />
        <span className="text-xs font-semibold">
          Chat with {mission.shortName}
        </span>
      </button>
    </div>
  );
};
