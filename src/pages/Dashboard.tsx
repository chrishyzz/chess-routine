import { useAuth } from '../AuthContext';
import { useState, useEffect } from 'react';
import { StudySessionForm } from '../components/StudySessionForm';
import { StudyChart } from '../components/StudyChart';
import { StatCard } from '../components/StatCard';
import { QuickTrackModal } from '../components/QuickTrackModal';
import { ProjectModal } from '../components/ProjectModal';

interface StudySession {
  id: string;
  type: 'puzzles' | 'opening' | 'endgame' | 'games' | 'tactics';
  duration: number;
  puzzlesSolved: number;
  date: string;
  notes: string;
}

interface QuickTrack {
  id: string;
  taskName: string;
  trackType: 'quantity' | 'duration';
  value: number;
  timestamp: string;
  // TODO: Add Lichess API integration fields (lichessGameId, lichessPuzzleId, etc.)
}

interface Project {
  id: string;
  title: string;
  totalGoal: number;
  unitName: string;
  currentProgress: number;
  createdAt: string;
  // TODO: Add Lichess API integration fields (apiEndpoint, autoSync, etc.)
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>(() => {
    const saved = localStorage.getItem('studySessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [quickTracks, setQuickTracks] = useState<QuickTrack[]>(() => {
    const saved = localStorage.getItem('quickTracks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [showForm, setShowForm] = useState(false);
  const [showQuickTrackModal, setShowQuickTrackModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('studySessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('quickTracks', JSON.stringify(quickTracks));
  }, [quickTracks]);

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  function addSession(session: Omit<StudySession, 'id'>) {
    const newSession: StudySession = {
      ...session,
      id: Date.now().toString(),
    };
    setSessions([newSession, ...sessions]);
    setShowForm(false);
  }

  function addQuickTrack(track: Omit<QuickTrack, 'id' | 'timestamp'>) {
    const newTrack: QuickTrack = {
      ...track,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setQuickTracks([newTrack, ...quickTracks]);
    setShowQuickTrackModal(false);

    // TODO: If this track is linked to Lichess API (e.g., "Puzzle Streak"),
    // automatically fetch and update from Lichess API endpoints
  }

  function addProject(project: Omit<Project, 'id' | 'currentProgress' | 'createdAt'>) {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      currentProgress: 0,
      createdAt: new Date().toISOString(),
    };
    setProjects([...projects, newProject]);
    setShowProjectModal(false);
  }

  function updateProjectProgress(projectId: string, increment: number) {
    setProjects(projects.map(project =>
      project.id === projectId
        ? { ...project, currentProgress: Math.min(project.totalGoal, project.currentProgress + increment) }
        : project
    ));

    // TODO: If this project is set to auto-sync with Lichess API,
    // fetch current progress from relevant API endpoints
  }

  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalPuzzles = sessions.reduce((sum, s) => sum + s.puzzlesSolved, 0);
  const thisWeekSessions = sessions.filter(s => {
    const sessionDate = new Date(s.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate > weekAgo;
  });

  // Prepare chart data (last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const daySessions = sessions.filter(s => s.date === dateStr);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      duration: daySessions.reduce((sum, s) => sum + s.duration, 0),
      puzzles: daySessions.reduce((sum, s) => sum + s.puzzlesSolved, 0),
    };
  });

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-primary border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Chess Study Tracker</h1>
            <p className="text-gray-400 mt-1">Welcome, {user?.username}! 👋</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Study Time"
            value={`${totalDuration} min`}
            icon="⏱️"
            trend={thisWeekSessions.length > 0 ? '+' + thisWeekSessions.length + ' this week' : 'No activity'}
          />
          <StatCard
            label="Puzzles Solved"
            value={totalPuzzles.toString()}
            icon="🧩"
            trend={`${(totalPuzzles / Math.max(1, sessions.length)).toFixed(0)} avg per session`}
          />
          <StatCard
            label="Sessions"
            value={sessions.length.toString()}
            icon="📚"
            trend={`${thisWeekSessions.length} this week`}
          />
          <StatCard
            label="Quick Tracks"
            value={quickTracks.length.toString()}
            icon="⚡"
            trend={projects.length > 0 ? `${projects.length} projects active` : 'No projects'}
          />
        </div>

        {/* Action Buttons */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {!showForm && !showQuickTrackModal && !showProjectModal && (
              <>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-accent hover:bg-blue-600 text-white font-semibold rounded-lg transition"
                >
                  + Add Study Session
                </button>
                <button
                  onClick={() => setShowQuickTrackModal(true)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                >
                  Quick Track
                </button>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
                >
                  Set Project
                </button>
              </>
            )}
          </div>

          {showForm && (
            <div className="bg-primary rounded-lg p-6 mt-4">
              <StudySessionForm
                onSubmit={addSession}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {showQuickTrackModal && (
            <QuickTrackModal
              onSubmit={addQuickTrack}
              onCancel={() => setShowQuickTrackModal(false)}
            />
          )}

          {showProjectModal && (
            <ProjectModal
              onSubmit={addProject}
              onCancel={() => setShowProjectModal(false)}
            />
          )}
        </div>

        {/* Charts */}
        {sessions.length > 0 && (
          <div className="bg-primary rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Last 7 Days</h2>
            <StudyChart data={chartData} />
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="bg-primary rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Projects</h2>
            <div className="space-y-4">
              {projects.map(project => (
                <div key={project.id} className="bg-secondary rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{project.title}</h3>
                    <span className="text-sm text-gray-400">
                      {project.currentProgress} / {project.totalGoal} {project.unitName}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(project.currentProgress / project.totalGoal) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {Math.round((project.currentProgress / project.totalGoal) * 100)}% complete
                    </span>
                    <button
                      onClick={() => {
                        const increment = prompt(`Add progress (${project.unitName}):`, '1');
                        if (increment && !isNaN(Number(increment))) {
                          updateProjectProgress(project.id, Number(increment));
                        }
                      }}
                      className="px-3 py-1 bg-accent hover:bg-blue-600 text-white text-sm rounded transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Quick Tracks */}
        {quickTracks.length > 0 && (
          <div className="bg-primary rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent Quick Tracks</h2>
            <div className="space-y-3">
              {quickTracks.slice(0, 10).map(track => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded hover:bg-gray-700 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {track.trackType === 'quantity' ? '🔢' : '⏱️'}
                      </span>
                      <div>
                        <p className="font-medium">{track.taskName}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(track.timestamp).toLocaleDateString()} at {new Date(track.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {track.value} {track.trackType === 'quantity' ? 'items' : 'minutes'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        <div className="bg-primary rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-400">No study sessions yet. Start tracking your progress! 🚀</p>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 10).map(session => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded hover:bg-gray-700 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {session.type === 'puzzles' && '🧩'}
                        {session.type === 'opening' && '🎯'}
                        {session.type === 'endgame' && '🏁'}
                        {session.type === 'games' && '🎮'}
                        {session.type === 'tactics' && '⚡'}
                      </span>
                      <div>
                        <p className="font-medium capitalize">{session.type.replace('-', ' ')}</p>
                        <p className="text-sm text-gray-400">{session.date}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{session.duration} min</p>
                    <p className="text-sm text-gray-400">{session.puzzlesSolved} puzzles</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
