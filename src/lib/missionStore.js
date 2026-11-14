import { supabase, isSupabaseConfigured } from './supabaseClient';
import { MISSIONS } from '../data/missionsData';

/**
 * Generates an ephemeral, auth-free session UUID held only in React memory
 * (no localStorage anywhere).
 */
export function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Ensures Supabase tables (missions, rover_pov_storylines, stage_transitions)
 * are seeded on first load, then returns merged MissionDossier records.
 * Falls back gracefully to local MISSIONS if Supabase is unavailable.
 * @returns {Promise<import('../types/mission').MissionDossier[]>}
 */
export async function ensureSeededAndLoadMissions() {
  if (!isSupabaseConfigured || !supabase) {
    return MISSIONS;
  }

  try {
    const { data: existingMissions, error: readErr } = await supabase
      .from('missions')
      .select('*')
      .order('sort_order', { ascending: true });

    if (readErr) {
      return MISSIONS;
    }

    if (!existingMissions || existingMissions.length === 0) {
      const missionRows = MISSIONS.map((m, idx) => ({
        id: m.id,
        short_name: m.shortName,
        timeline_header: m.timelineHeader,
        short_nav_label: m.shortNavLabel,
        title: m.title,
        subtitle: m.subtitle,
        era: m.era,
        nssdca_ids: m.nssdcaIds,
        coordinates: m.coordinates,
        launch_vehicle: m.launchVehicle,
        launch_date: m.launchDate,
        landing_or_event_date: m.landingOrEventDate,
        mass_kg: m.massKg,
        personnel: m.personnel,
        data_collected: m.dataCollected,
        final_status: m.finalStatus,
        status_tag: m.statusTag,
        transition_kind: m.transitionKind,
        objective_text: m.objectiveText,
        narrative_ending: m.narrativeEnding,
        model_type: m.modelType,
        baseline: m.baseline,
        hardware_pins: m.hardwarePins,
        badge: m.badge,
        suggested_prompts: m.suggestedPrompts,
        knowledge_facts: m.knowledgeFacts,
        sort_order: idx,
      }));

      const povRows = MISSIONS.map((m) => ({
        mission_id: m.id,
        pov_story: m.povStory,
        voice_persona: m.voicePersona,
      }));

      const transitionRows = MISSIONS.map((m) => ({
        mission_id: m.id,
        transition_kind: m.transitionKind,
        target_coords: m.discoveryHandoff.targetCoords,
        target_name: m.discoveryHandoff.targetName,
        sender_name: m.discoveryHandoff.senderName,
        sender_line: m.discoveryHandoff.senderLine,
        receiver_name: m.discoveryHandoff.receiverName,
        receiver_line: m.discoveryHandoff.receiverLine,
      }));

      await supabase.from('missions').upsert(missionRows, { onConflict: 'id' });
      await supabase
        .from('rover_pov_storylines')
        .upsert(povRows, { onConflict: 'mission_id' });
      await supabase
        .from('stage_transitions')
        .upsert(transitionRows, { onConflict: 'mission_id' });

      return MISSIONS;
    }

    const [{ data: povData }, { data: transitionData }] = await Promise.all([
      supabase.from('rover_pov_storylines').select('*'),
      supabase.from('stage_transitions').select('*'),
    ]);

    const povById = new Map((povData || []).map((row) => [row.mission_id, row]));
    const transById = new Map(
      (transitionData || []).map((row) => [row.mission_id, row])
    );
    const dbById = new Map(existingMissions.map((row) => [row.id, row]));

    return MISSIONS.map((fallback) => {
      const db = dbById.get(fallback.id);
      const pov = povById.get(fallback.id);
      const trans = transById.get(fallback.id);

      return {
        ...fallback,
        shortName: db?.short_name || fallback.shortName,
        timelineHeader: db?.timeline_header || fallback.timelineHeader,
        shortNavLabel: db?.short_nav_label || fallback.shortNavLabel,
        title: db?.title || fallback.title,
        subtitle: db?.subtitle || fallback.subtitle,
        era: db?.era || fallback.era,
        nssdcaIds: db?.nssdca_ids || fallback.nssdcaIds,
        coordinates: db?.coordinates || fallback.coordinates,
        launchVehicle: db?.launch_vehicle || fallback.launchVehicle,
        launchDate: db?.launch_date || fallback.launchDate,
        landingOrEventDate: db?.landing_or_event_date || fallback.landingOrEventDate,
        massKg: db?.mass_kg || fallback.massKg,
        personnel: Array.isArray(db?.personnel) ? db.personnel : fallback.personnel,
        dataCollected: db?.data_collected || fallback.dataCollected,
        finalStatus: db?.final_status || fallback.finalStatus,
        statusTag: db?.status_tag || fallback.statusTag,
        transitionKind: db?.transition_kind || fallback.transitionKind,
        objectiveText: db?.objective_text || fallback.objectiveText,
        narrativeEnding: db?.narrative_ending || fallback.narrativeEnding,
        baseline: db?.baseline || fallback.baseline,
        hardwarePins: Array.isArray(db?.hardware_pins)
          ? db.hardware_pins
          : fallback.hardwarePins,
        badge: db?.badge || fallback.badge,
        suggestedPrompts: Array.isArray(db?.suggested_prompts)
          ? db.suggested_prompts
          : fallback.suggestedPrompts,
        knowledgeFacts: Array.isArray(db?.knowledge_facts)
          ? db.knowledge_facts
          : fallback.knowledgeFacts,
        povStory: pov?.pov_story || fallback.povStory,
        voicePersona: pov?.voice_persona || fallback.voicePersona,
        discoveryHandoff: trans
          ? {
              targetCoords: trans.target_coords || fallback.discoveryHandoff.targetCoords,
              targetName: trans.target_name || fallback.discoveryHandoff.targetName,
              senderName: trans.sender_name || fallback.discoveryHandoff.senderName,
              senderLine: trans.sender_line || fallback.discoveryHandoff.senderLine,
              receiverName: trans.receiver_name || fallback.discoveryHandoff.receiverName,
              receiverLine: trans.receiver_line || fallback.discoveryHandoff.receiverLine,
            }
          : fallback.discoveryHandoff,
      };
    });
  } catch {
    return MISSIONS;
  }
}

/**
 * @param {string} sessionId
 */
export async function loadSessionProgress(sessionId) {
  if (!isSupabaseConfigured || !supabase || !sessionId) return null;
  try {
    const { data, error } = await supabase
      .from('session_progress')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      activeStage: data.active_stage || 'prologue',
      simState: data.sim_state || {},
      completedObjectives: data.completed_objectives || {},
      earnedBadges: Array.isArray(data.earned_badges) ? data.earned_badges : [],
    };
  } catch {
    return null;
  }
}

/**
 * @param {string} sessionId
 * @param {{ activeStage: string, simState: Record<string, any>, completedObjectives: Record<string, boolean>, earnedBadges: string[] }} payload
 */
export async function saveSessionProgress(sessionId, payload) {
  if (!isSupabaseConfigured || !supabase || !sessionId) return;
  try {
    await supabase.from('session_progress').upsert(
      {
        session_id: sessionId,
        active_stage: payload.activeStage,
        sim_state: payload.simState,
        completed_objectives: payload.completedObjectives,
        earned_badges: payload.earnedBadges,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'session_id' }
    );
  } catch {
    // Graceful in-memory fallback
  }
}

/**
 * @param {string} sessionId
 * @returns {Promise<import('../types/mission').ChatMessage[]>}
 */
export async function loadSessionChats(sessionId) {
  if (!isSupabaseConfigured || !supabase || !sessionId) return [];
  try {
    const { data, error } = await supabase
      .from('rover_chats')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      sender: row.sender,
      senderId: row.sender_id,
      role: row.role,
      text: row.text,
      timestamp: row.timestamp_label,
      mode: row.mode || 'direct',
      missionId: row.mission_id,
      source: row.source || undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * @param {string} sessionId
 * @param {import('../types/mission').ChatMessage[]} messages
 */
export async function saveChatMessages(sessionId, messages) {
  if (!isSupabaseConfigured || !supabase || !sessionId || !messages.length) return;
  try {
    const rows = messages.map((m) => ({
      id: m.id,
      session_id: sessionId,
      mission_id: m.missionId || 'prologue',
      sender: m.sender,
      sender_id: m.senderId,
      role: m.role,
      text: m.text,
      mode: m.mode || 'direct',
      source: m.source || null,
      timestamp_label: m.timestamp,
    }));
    await supabase.from('rover_chats').upsert(rows, { onConflict: 'id' });
  } catch {
    // Graceful in-memory fallback
  }
}
