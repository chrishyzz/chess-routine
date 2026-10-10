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
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT progress_fields_check CHECK (
    (type = 'time' AND unit_name IS NULL AND goal IS NULL AND current_progress IS NULL) OR
    (type = 'progress' AND unit_name IS NOT NULL AND goal IS NOT NULL AND current_progress IS NOT NULL)
  )
);

-- Create index on user_id and archived_at for efficient querying
CREATE INDEX idx_projects_user_id_archived ON projects(user_id, archived_at);

-- Add persisted active/backlog state for existing project tables.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_user_active
  ON public.projects(user_id, is_active)
  WHERE archived_at IS NULL;

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

-- Persist each user's active Focus Mode configuration.
create table if not exists focus_sprints (
  user_id text primary key,
  category text not null,
  duration_type text not null check (duration_type in ('time', 'volume')),
  duration_value numeric not null check (duration_value > 0),
  target_ratio integer not null check (target_ratio between 1 and 99),
  started_at timestamptz not null default now()
);
alter table focus_sprints disable row level security;

-- Link each study session to at most one project and preserve its activity date.
alter table public.study_sessions
  add column if not exists project_id uuid,
  add column if not exists session_date date;

update public.study_sessions
set session_date = coalesce(created_at::date, current_date)
where session_date is null;

alter table public.study_sessions
  alter column session_date set default current_date,
  alter column session_date set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'study_sessions_project_id_fkey'
      and conrelid = 'public.study_sessions'::regclass
  ) then
    alter table public.study_sessions
      add constraint study_sessions_project_id_fkey
      foreign key (project_id)
      references public.projects(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_study_sessions_user_project
  on public.study_sessions(user_id, project_id);
create index if not exists idx_study_sessions_user_date
  on public.study_sessions(user_id, session_date);

create or replace function public.sync_study_session_project_category()
returns trigger
language plpgsql
as $$
begin
  if new.project_id is not null then
    select project.category
    into new.category
    from public.projects as project
    where project.id = new.project_id
      and project.user_id::text = new.user_id::text;

    if not found then
      raise exception 'Project % does not belong to user %', new.project_id, new.user_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists study_sessions_sync_project_category on public.study_sessions;
create trigger study_sessions_sync_project_category
before insert or update of project_id, user_id
on public.study_sessions
for each row
execute function public.sync_study_session_project_category();

create or replace function public.sync_project_category_to_study_sessions()
returns trigger
language plpgsql
as $$
begin
  update public.study_sessions
  set category = new.category
  where project_id = new.id;

  return new;
end;
$$;

drop trigger if exists projects_sync_category_to_study_sessions on public.projects;
create trigger projects_sync_category_to_study_sessions
after update of category
on public.projects
for each row
when (old.category is distinct from new.category)
execute function public.sync_project_category_to_study_sessions();

notify pgrst, 'reload schema';

-- Store qualitative post-game analysis for authenticated users.
create table if not exists public.game_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade null,
  lichess_username text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  lichess_url text,
  game_result text check (game_result in ('Win', 'Loss', 'Draw')),
  rating_opening integer check (rating_opening between 1 and 10),
  rating_middlegame integer check (rating_middlegame between 1 and 10),
  rating_endgame integer check (rating_endgame between 1 and 10),
  mistake_tags text[] default '{}',
  focus_rating integer check (focus_rating between 0 and 100),
  narrative_note text
);

alter table public.game_logs
  add column if not exists lichess_username text;

-- Allow N/a selections for phases that were not reached.
alter table public.game_logs
  alter column rating_middlegame drop not null,
  alter column rating_endgame drop not null;

create index if not exists idx_game_logs_user_created
  on public.game_logs(user_id, created_at desc);

create index if not exists idx_game_logs_lichess_username_created
  on public.game_logs(lichess_username, created_at desc);

alter table public.game_logs enable row level security;

-- Username-based logs have no authenticated owner; reads are intentionally public.
drop policy if exists "Anyone can read game logs" on public.game_logs;
create policy "Anyone can read game logs"
  on public.game_logs for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can insert username-attributed game logs" on public.game_logs;
create policy "Anyone can insert username-attributed game logs"
  on public.game_logs for insert
  to anon, authenticated
  with check (
    user_id is null
    and lichess_username is not null
    and length(btrim(lichess_username)) > 0
  );

grant select, insert on public.game_logs to anon, authenticated;

drop policy if exists "Users can read their own game logs" on public.game_logs;
create policy "Users can read their own game logs"
  on public.game_logs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own game logs" on public.game_logs;
create policy "Users can insert their own game logs"
  on public.game_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own game logs" on public.game_logs;
create policy "Users can update their own game logs"
  on public.game_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own game logs" on public.game_logs;
create policy "Users can delete their own game logs"
  on public.game_logs for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
