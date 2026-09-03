# Chess Routine: An app for self-directed chess training.

A simple, light-weight way to track chess study, inspired by fitness apps.

## Features

- Login via Lichess
- Log different types of study – from solving puzzles to playing or reading a book.
- Visual charts showing your progress over time
- Use the app seamlessly across devices

## How to Use

1. Login - Click "Login with Lichess" and authorise the app
2. Log a session - Record study time, category, and optional notes
3. Track projects - Create long-running goals and log progress against them
4. View progress - See your activity heatmap and time breakdown by category

## Data Storage

Study sessions are stored in a Supabase database, tied to your Lichess account. Your data is available across devices and persists between sessions.

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
