# Chess Study Tracker

A simple, light-weight app to track chess study, inspired by fitness apps.

## Features

- Login via Lichess
- Log different types of study – from solving puzzles to playing or reading a book.
- Visual charts showing your progress over time
- Use the app seamlessly across devices

## Setup & Installation

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. Install dependencies:

```bash
cd app
npm install
# or
pnpm install
```

2. Start development server:

```bash
npm run dev
# or
pnpm dev
```

The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
# or
pnpm build
```

This generates an optimized build in the `dist/` directory.

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
