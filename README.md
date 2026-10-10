# Chess Routine: A simple way to track chess study, inspired by fitness apps.

An app for self-directed chess training.

## Features

- Login via Lichess
- Log different types of study – from solving puzzles to playing or reading a book.
- Visual charts showing your progress over time
- Use the app seamlessly across devices
- Focus Mode with a focus category, duration target, and time-distribution goal
- An active project priority queue with a collapsible project backlog
- Quick post-game analysis logs with optional phase ratings, pattern tags, focus rating, and CSV export

## How to Use

1. Login - Click "Login with Lichess" and authorise the app
2. Log a session - Record study time, category, and optional notes
3. Track projects - Create long-running goals and log progress against them
4. Move lower-priority projects to the backlog and promote them to the active queue when needed
5. View progress - See your activity heatmap and time breakdown by category
6. Start Focus Mode - Choose a category, target ratio, and time-based or logged-hours target

## Data Storage

Study sessions are stored in a Supabase database, tied to your Lichess account. Your data is available across devices and persists between sessions.

Focus Mode configurations remain active across devices until the time-based duration ends or you end Focus Mode manually. Study sessions logged from a project are linked through `study_sessions.project_id`; their `session_date` drives date-based reports, and the database keeps their category aligned with the linked project. Apply the migrations in `supabase_migrations.sql` in the Supabase SQL editor before using these features.

Project active/backlog state is stored in `projects.is_active`; apply the corresponding migration in `supabase_migrations.sql` to existing Supabase databases.

Game analysis logs are opened from the Post-game analysis button beside Focus Mode. Middlegame and endgame ratings can be marked N/a when those phases were not reached. Logs are saved to `game_logs` for an active Supabase Auth session; without one, they are stored in this browser's local storage and can be exported as CSV. The existing Lichess OAuth login is separate from Supabase Auth, so Lichess sign-in alone uses browser-local storage. Apply the `game_logs` migration in `supabase_migrations.sql` before saving account-backed logs.

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
