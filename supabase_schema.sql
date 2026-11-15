-- The Quiet Vigil — Supabase Schema (No-Auth Public Session Persistence)
-- Run this SQL once in your Supabase SQL Editor if auto-created tables are not yet provisioned.

CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  short_name TEXT NOT NULL,
  timeline_header TEXT NOT NULL,
  short_nav_label TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  era TEXT NOT NULL,
  nssdca_ids TEXT NOT NULL,
  coordinates TEXT NOT NULL,
  launch_vehicle TEXT NOT NULL,
  launch_date TEXT NOT NULL,
  landing_or_event_date TEXT NOT NULL,
  mass_kg TEXT NOT NULL,
  personnel JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_collected TEXT NOT NULL,
  final_status TEXT NOT NULL,
  status_tag TEXT NOT NULL,
  transition_kind TEXT NOT NULL,
  objective_text TEXT NOT NULL,
  narrative_ending TEXT NOT NULL,
  model_type TEXT NOT NULL,
  baseline JSONB NOT NULL,
  hardware_pins JSONB NOT NULL DEFAULT '[]'::jsonb,
  badge JSONB NOT NULL,
  suggested_prompts JSONB NOT NULL DEFAULT '[]'::jsonb,
  knowledge_facts JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rover_pov_storylines (
  mission_id TEXT PRIMARY KEY REFERENCES missions(id) ON DELETE CASCADE,
  pov_story TEXT NOT NULL,
  voice_persona TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stage_transitions (
  mission_id TEXT PRIMARY KEY REFERENCES missions(id) ON DELETE CASCADE,
  transition_kind TEXT NOT NULL,
  target_coords TEXT NOT NULL,
  target_name TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_line TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_line TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rover_chats (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'spacecraft')),
  text TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'direct' CHECK (mode IN ('direct', 'reunion')),
  source TEXT,
  timestamp_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rover_chats_session ON rover_chats (session_id, created_at);

CREATE TABLE IF NOT EXISTS session_progress (
  session_id TEXT PRIMARY KEY,
  active_stage TEXT NOT NULL DEFAULT 'prologue',
  sim_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_objectives JSONB NOT NULL DEFAULT '{}'::jsonb,
  earned_badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS with permissive anonymous session access (no login required)
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rover_pov_storylines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rover_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read/seed missions" ON missions;
CREATE POLICY "Public read/seed missions" ON missions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read/seed storylines" ON rover_pov_storylines;
CREATE POLICY "Public read/seed storylines" ON rover_pov_storylines FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read/seed transitions" ON stage_transitions;
CREATE POLICY "Public read/seed transitions" ON stage_transitions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public session rover chats" ON rover_chats;
CREATE POLICY "Public session rover chats" ON rover_chats FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public session progress" ON session_progress;
CREATE POLICY "Public session progress" ON session_progress FOR ALL USING (true) WITH CHECK (true);
