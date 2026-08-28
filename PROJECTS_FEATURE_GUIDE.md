# Projects Feature Implementation Guide

## Overview
This guide explains how to set up the Projects feature for the Chess Study Tracker app.

## Database Setup

### Step 1: Create the Projects Table

Run the SQL migration in Supabase:

```sql
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
```

## Features Implemented

### 1. Project Types
- **Progress-based**: Has a measurable goal with a unit (e.g., "Read My System — 60 pages")
  - Fields: `title`, `category`, `unit_name`, `goal`, `current_progress`
  - When logging a session, you specify time spent + progress amount
  
- **Time-based**: No finish line, just a recurring session (e.g., "Daily calculation practice")
  - Fields: `title`, `category` only
  - When logging a session, you specify time spent only

### 2. UI Components

#### Projects Section
- Displays above "Log a study session"
- Shows all active (non-archived) projects
- "New Project" button to create projects

#### Project Card
- Title + category badge
- Progress bar + `current_progress / goal unit_name` label (progress-based only)
- Total time logged (sum from study_sessions by category)
- "Log" button to expand inline session logging form
- "Archive" button when project is 100% complete (progress-based only)

#### New Project Form
- Title field
- Category dropdown (Games & analysis, Tactics, Endgame, Middlegame, Openings)
- Type toggle (Time-based / Progress-based)
- Unit name + Goal fields (shown only for progress-based)

#### Log Session Form (Inline)
- Time spent (minutes) field
- Progress amount field (progress-based projects only)
- Notes field (optional)
- Submit button performs atomic operations:
  1. Insert row into `study_sessions` table
  2. Update `current_progress` on project (progress-based only)

### 3. Data Flow

When logging a session against a project:
1. A new study session is inserted into `study_sessions` table
2. This session automatically appears in:
   - Past Sessions list
   - Heatmap analytics
   - Pie chart analytics
3. For progress-based projects, the project's `current_progress` is incremented

### 4. Styling

- Uses Tailwind CSS with dark theme
- Custom colors: `bg-primary`, `bg-secondary`, `bg-accent`
- Category badges use distinct colors:
  - Games & analysis: Blue
  - Tactics: Purple
  - Endgame: Emerald
  - Middlegame: Amber
  - Openings: Red

## Note on Time Calculation

**Current Implementation**: The "Total time logged" is calculated by summing all `study_sessions` with the same category as the project.

**Production Recommendation**: Add a `project_id` foreign key to the `study_sessions` table to track which sessions belong to which project. This would allow for:
- More accurate time tracking per project
- Better performance on queries
- Clearer data relationships

To implement this in production, you would:
1. Add column: `ALTER TABLE study_sessions ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;`
2. Update the logging logic to include the project_id when inserting sessions
3. Update the time calculation query in Projects.tsx to sum only sessions with matching project_id

## File Changes

- Created: `/src/components/Projects.tsx` - Main Projects component with all UI and logic
- Updated: `/src/pages/Dashboard.tsx` - Added Projects component import and rendering
- Created: `/supabase_migrations.sql` - SQL migration for projects table

## Testing

1. Create a time-based project (e.g., "Daily calculation")
2. Create a progress-based project (e.g., "Read My System — 60 pages")
3. Log sessions against each project type
4. Verify sessions appear in Past Sessions
5. Verify progress bar updates correctly
6. Archive a completed project
7. Verify analytics reflect logged sessions
