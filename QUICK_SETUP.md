# Quick Setup Guide: Projects Feature

## TL;DR - 3 Steps to Enable Projects

### 1️⃣ Copy This SQL

```sql
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

CREATE INDEX idx_projects_user_id_archived ON projects(user_id, archived_at);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own projects"
  ON projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE USING (auth.uid() = user_id);
```

### 2️⃣ Run SQL in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **+ New Query**
5. Paste the SQL above
6. Click **Run** (▶️ button)
7. You should see "Finished successfully"

### 3️⃣ Done! 🎉

- Projects section now appears at top of Dashboard
- Features available:
  - Create new projects (time-based or progress-based)
  - Log sessions against projects
  - View progress (with progress bar for goal-based)
  - Archive completed projects
  - Sessions automatically sync with analytics

## What Just Happened?

✅ Created `projects` table with proper constraints  
✅ Added row-level security (users see only their projects)  
✅ Added index for fast queries  
✅ Code already handles rest of the integration  

## Test It Out

```
1. npm run dev
2. Log in
3. Click "+ New Project"
4. Create a test project (e.g., "Daily practice — 90 minutes")
5. Click "Log" on the project card
6. Log a session
7. Verify it appears in "Past sessions" and analytics
```

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "relation 'projects' does not exist" | SQL didn't run successfully, try again |
| Projects section doesn't show | Refresh browser, clear cache |
| Sessions not saving | Check browser console for error messages |
| Progress not updating | Make sure you selected a progress-based project |

## Need the Full Details?

- 📖 Read `IMPLEMENTATION_SUMMARY.md` for complete overview
- 🔧 Read `PROJECTS_FEATURE_GUIDE.md` for technical details
- 💾 See `supabase_migrations.sql` for the raw SQL

---

That's it! Projects feature is now live 🚀
