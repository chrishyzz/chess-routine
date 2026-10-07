-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('progress', 'time')),
  unit_name TEXT,
  goal NUMERIC,
  current_progress NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT progress_fields_check CHECK (
    (type = 'time' AND unit_name IS NULL AND goal IS NULL AND current_progress IS NULL) OR
    (type = 'progress' AND unit_name IS NOT NULL AND goal IS NOT NULL AND current_progress IS NOT NULL)
  )
);

-- Create index on user_id and archived_at for efficient querying
CREATE INDEX idx_projects_user_id_archived ON projects(user_id, archived_at);

-- Enable RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own projects
CREATE POLICY "Users can read their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Add separate activity tracking columns to study_sessions table
ALTER TABLE study_sessions DROP COLUMN IF EXISTS activity_count;
ALTER TABLE study_sessions ADD COLUMN puzzles_solved INTEGER DEFAULT 0;
ALTER TABLE study_sessions ADD COLUMN games_played INTEGER DEFAULT 0;

-- Add cadence field to goals table
ALTER TABLE goals ADD COLUMN cadence TEXT NOT NULL DEFAULT 'daily' CHECK (cadence IN ('daily', 'weekly'));

-- Run this migration separately in Supabase before testing.
create table category_targets (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  category text not null,
  target_percentage integer not null,
  created_at timestamptz default now(),
  unique(user_id, category)
);
alter table category_targets disable row level security;

-- Persist each user's active Focus Mode / Priority Sprint.
create table if not exists focus_sprints (
  user_id text primary key,
  category text not null,
  duration_type text not null check (duration_type in ('time', 'volume')),
  duration_value numeric not null check (duration_value > 0),
  target_ratio integer not null check (target_ratio between 1 and 99),
  started_at timestamptz not null default now()
);
alter table focus_sprints disable row level security;
