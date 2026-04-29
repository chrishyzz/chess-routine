# Chess Study Tracker

A beautiful, modern chess study tracking app built with React and Lichess OAuth authentication. Track your study sessions, puzzles solved, and visualize your progress over time.

## Features

✨ **Lichess Authentication** - Secure login via your Lichess account  
📊 **Study Tracking** - Log study sessions with type, duration, and puzzles solved  
⚡ **Quick Track** - Quickly log one-off activities like "Rapid Game" or "Puzzle Streak"  
🎯 **Projects** - Set long-term goals with progress tracking (e.g., "Read 150 pages")  
📈 **Statistics** - Visual charts showing your progress over the last 7 days  
🎯 **Study Types** - Track different study areas: Puzzles, Openings, Endgames, Games, Tactics  
💾 **Local Storage** - Your data is saved locally on your device  
🎨 **Modern UI** - Clean, Hevy-inspired design with Tailwind CSS  

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **@bity/oauth2-auth-code-pkce** - OAuth authentication

## Future Features

🔗 **Lichess API Integration** - Automatically sync progress from Lichess:
- Track puzzles solved directly from your Lichess account
- Auto-update project progress based on games played
- Sync study streaks and achievements
- Import game analysis and study data

## Setup & Installation

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

1. **Install dependencies:**

```bash
cd app
npm install
# or
pnpm install
```

2. **Start development server:**

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

1. **Login** - Click "Login with Lichess" button
2. **Authenticate** - You'll be redirected to Lichess to authorize the app
3. **Track Sessions** - Click "+ Add Study Session" to log your study activities
4. **View Progress** - See your stats and charts on the dashboard
5. **Logout** - Click the logout button in the header

## Data Storage

Your study sessions are stored locally in your browser's localStorage. This means:
- ✅ Your data stays on your device
- ✅ No data is sent to any server
- ✅ Data persists between sessions
- ⚠️ Clearing browser data will delete your sessions

## Lichess OAuth Setup

This app uses Lichess OAuth for authentication. The OAuth configuration is:

- **Client ID:** `chess-study-tracker`
- **Scopes:** `email:read`
- **Flow:** OAuth 2.0 with PKCE (client-side safe)

To use your own Lichess API application:

1. Go to https://lichess.org/account/oauth/app
2. Create a new app with your redirect URL:
   - For local dev: `http://localhost:5173`
   - For production: Your deployed URL
3. Update the `clientId` in [src/AuthContext.tsx](src/AuthContext.tsx)

## Project Structure

```
src/
├── main.tsx              # React entry point
├── App.tsx               # Main app component
├── AuthContext.tsx       # Lichess OAuth & auth state
├── index.css             # Tailwind CSS setup
├── pages/
│   ├── LoginPage.tsx     # Login screen
│   └── Dashboard.tsx     # Main dashboard & session tracking
└── components/
    ├── Loader.tsx        # Loading spinner
    ├── StatCard.tsx      # Stat cards component
    ├── StudyChart.tsx    # Progress charts
    └── StudySessionForm.tsx  # Add session form
```

## Features Coming Soon

- 🔄 Sync with Lichess account data
- 📱 Mobile app version
- 🎯 Goal setting and tracking
- 👥 Social features / leaderboards
- 🔔 Progress notifications
- 🌙 Dark/Light theme toggle

## License

MIT

## Support

For issues or questions:
1. Check the [Lichess API documentation](https://lichess.org/api)
2. Review the [OAuth examples](https://github.com/lichess-org/api/tree/master/example)
