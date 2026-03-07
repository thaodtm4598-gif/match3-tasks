-- ─── MATCH3 TASK BOARD SCHEMA ─────────────────────────────────────────────────
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id          TEXT PRIMARY KEY,
  summary     TEXT        NOT NULL,
  label       TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'Open',
  priority    TEXT        NOT NULL DEFAULT 'Medium',
  assignee    TEXT                 DEFAULT '',
  start_date  TEXT,
  end_date    TEXT,
  sprint      TEXT                 DEFAULT 'Sprint 1',
  note        TEXT                 DEFAULT '',
  created_at  TIMESTAMPTZ          DEFAULT NOW(),
  updated_at  TIMESTAMPTZ          DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security: only authenticated users can access tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access"
  ON public.tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for the tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
