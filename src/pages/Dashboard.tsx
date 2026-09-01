import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { StudySessionForm, StudyCategory } from '../components/StudySessionForm';
import { StudyAnalytics } from '../components/StudyAnalytics';
import { Projects } from '../components/Projects';
import { Goals } from '../components/Goals';
import { supabase } from '../lib/supabase';

interface StudySession {
  id: string;
  category: StudyCategory;
  durationMinutes: number;
  puzzlesSolved: number;
  gamesPlayed: number;
  notes: string;
  createdAt: string;
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getLocalDateKey(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function groupSessionsByDate(sessions: StudySession[]): { label: string; key: string; sessions: StudySession[] }[] {
  const groups: { label: string; key: string; sessions: StudySession[] }[] = [];

  for (const session of sessions) {
    const key = getLocalDateKey(session.createdAt);
    const existing = groups.find(g => g.key === key);
    if (existing) {
      existing.sessions.push(session);
    } else {
      groups.push({ label: getDateLabel(session.createdAt), key, sessions: [session] });
    }
  }

  return groups;
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!user) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
  .from('study_sessions')
  .select('id, category, duration_minutes, puzzles_solved, games_played, notes, created_at')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(30);

    if (fetchError) {
      setError(fetchError.message);
      setIsLoading(false);
      return;
    }

    setSessions(data.map(session => ({
      id: session.id,
      category: session.category as StudyCategory,
      durationMinutes: session.duration_minutes,
      puzzlesSolved: session.puzzles_solved || 0,
      gamesPlayed: session.games_played || 0,
      notes: session.notes,
      createdAt: session.created_at,
    })));
    setIsLoading(false);
  };

  useEffect(() => {
    let isCancelled = false;
    async function fetch() {
      if (!isCancelled) {
        await fetchSessions();
      }
    }
    void fetch();
    return () => {
      isCancelled = true;
    };
  }, [user]);

  async function logSession(session: Omit<StudySession, 'id' | 'createdAt'>) {
    if (!user) {
      return;
    }

    setError(null);
    const createdAt = new Date().toISOString();
    const { data, error: insertError } = await supabase
      .from('study_sessions')
      .insert({
        user_id: user.id,
        category: session.category,
        duration_minutes: session.durationMinutes,
        puzzles_solved: session.puzzlesSolved,
        games_played: session.gamesPlayed,
        notes: session.notes,
        created_at: createdAt,
      })
      .select('id, category, duration_minutes, puzzles_solved, games_played, notes, created_at')
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSessions(currentSessions => [{
      id: data.id,
      category: data.category as StudyCategory,
      durationMinutes: data.duration_minutes,
      puzzlesSolved: data.puzzles_solved || 0,
      gamesPlayed: data.games_played || 0,
      notes: data.notes,
      createdAt: data.created_at,
    }, ...currentSessions]);
  }

  async function deleteSession(sessionId: string) {
    if (!user || !window.confirm('Delete this study session?')) {
      return;
    }

    setError(null);
    const { error: deleteError } = await supabase
      .from('study_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setSessions(currentSessions => currentSessions.filter(session => session.id !== sessionId));
  }

  const sessionGroups = groupSessionsByDate(sessions);

  return (
    <div className="min-h-screen bg-secondary text-white">
      <header className="border-b border-gray-800 bg-primary">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
          <div>
            <h1 className="text-2xl font-bold">Chess Routine</h1>
            <p className="mt-1 text-sm text-gray-400">Welcome, {user?.username}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded bg-gray-700 px-3 py-2 text-sm text-white transition hover:bg-gray-600"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-3xl overflow-x-hidden px-4 py-8">
        <section className="min-w-0 rounded-lg bg-primary p-4 sm:p-6">
          <h2 className="mb-1 text-xl font-semibold">Study session</h2>
          <p className="mb-6 text-sm text-gray-400">Log your activity with a quick note.</p>
          <StudySessionForm onSubmit={logSession} />
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </section>

        {user && <Projects userId={user.id} error={error} onError={setError} onSessionLogged={() => void fetchSessions()} />}

        {user && <Goals userId={user.id} sessions={sessions} error={error} onError={setError} />}

        {!isLoading && <StudyAnalytics sessions={sessions} />}

        <section className="mt-8 min-w-0">
          <h2 className="mb-4 text-xl font-semibold">Past sessions</h2>
          {isLoading ? (
            <p className="rounded-lg bg-primary px-5 py-8 text-center text-sm text-gray-400">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-700 px-5 py-8 text-center text-sm text-gray-400">
              Your logged sessions will appear here.
            </p>
          ) : (
            <div className="min-w-0 space-y-6">
              {sessionGroups.map((group, groupIndex) => (
                <div key={group.key}>
                 <p className={`mb-2 text-xs uppercase tracking-widest text-accent ${groupIndex === 0 ? '' : 'mt-6'}`}>
                    {group.label}
                  </p>
                  <div className="min-w-0 divide-y divide-gray-800 overflow-hidden rounded-lg bg-primary">
                    {group.sessions.map(session => (
                      <article key={session.id} className="min-w-0 px-4 py-4 sm:px-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-medium">{session.category}</h3>
                            <p className="mt-1 text-sm text-gray-300">{session.durationMinutes} minutes</p>
                            {session.puzzlesSolved > 0 && <p className="mt-1 text-sm text-gray-300">{session.puzzlesSolved} puzzles</p>}
                            {session.gamesPlayed > 0 && <p className="mt-1 text-sm text-gray-300">{session.gamesPlayed} games</p>}
                            {session.notes && <p className="mt-2 break-words text-sm text-gray-400">{session.notes}</p>}
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <time className="text-sm text-gray-500" dateTime={session.createdAt}>
                              {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </time>
                          <button 
  type="button" 
  onClick={() => void deleteSession(session.id)} 
  className="text-sm text-gray-500 transition hover:text-red-400"
>
  Delete
</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
