# Chess Routine: A simple way to track chess study, inspired by fitness apps.

An app for self-directed chess training.

## Features

- Login via Lichess
- Log different types of study – from solving puzzles to playing or reading a book.
- Visual charts showing your progress over time
- Use the app seamlessly across devices
- Focus Mode sprints with a priority category, duration target, and time-distribution goal
- An active project priority queue with a collapsible project backlog

## How to Use

1. Login - Click "Login with Lichess" and authorise the app
2. Log a session - Record study time, category, and optional notes
3. Track projects - Create long-running goals and log progress against them
4. Move lower-priority projects to the backlog and promote them to the active queue when needed
5. View progress - See your activity heatmap and time breakdown by category
6. Start a Focus Mode sprint - Choose a category, target ratio, and time-based or logged-hours target

## Data Storage

Study sessions are stored in a Supabase database, tied to your Lichess account. Your data is available across devices and persists between sessions.

Focus Mode configurations are stored in the `focus_sprints` Supabase table and remain active across devices until the time-based sprint ends or you end it manually. Study sessions logged from a project are linked through `study_sessions.project_id`; their `session_date` drives date-based reports, and the database keeps their category aligned with the linked project. Apply the migrations in `supabase_migrations.sql` in the Supabase SQL editor before using these features.

Project active/backlog state is stored in `projects.is_active`; apply the corresponding migration in `supabase_migrations.sql` to existing Supabase databases.

## Lichess OAuth Setup

This app uses Lichess OAuth for authentication. The OAuth configuration is:

- Client ID: `chess-study-tracker`
- Scopes: `email:read`
- Flow: OAuth 2.0 with PKCE (client-side safe)

To use your own Lichess API application:

1. Go to https://lichess.org/account/oauth/app
2. Create a new app with your redirect URL:
   - For local dev: `http://localhost:5173`
   - For production: Your deployed URL
3. Update the `clientId` in src/AuthContext.tsx

#
