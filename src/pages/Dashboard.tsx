import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { StudySessionForm, StudyCategory } from '../components/StudySessionForm';
import { StudyAnalytics } from '../components/StudyAnalytics';
import { supabase } from '../lib/supabase';

interface StudySession {
  id: string;
  category: StudyCategory;
  durationMinutes: number;
  notes: string;
  createdAt: string;
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    const userId = user.id;

    async function fetchSessions() {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('study_sessions')
        .select('id, category, duration_minutes, notes, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (isCancelled) {
        return;
      }

      if (fetchError) {
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      setSessions(data.map(session => ({
        id: session.id,
        category: session.category as StudyCategory,
        durationMinutes: session.duration_minutes,
        notes: session.notes,
        createdAt: session.created_at,
      })));
      setIsLoading(false);
    }

    void fetchSessions();

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
        notes: session.notes,
        created_at: createdAt,
      })
      .select('id, category, duration_minutes, notes, created_at')
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSessions(currentSessions => [{
      id: data.id,
      category: data.category as StudyCategory,
      durationMinutes: data.duration_minutes,
      notes: data.notes,
      createdAt: data.created_at,
    }, ...currentSessions]);
  }

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

      <main className="mx-auto max-w-3xl px-4 py-8">
        <section className="rounded-lg bg-primary p-6">
          <h2 className="mb-1 text-xl font-semibold">Log a study session</h2>
          <p className="mb-6 text-sm text-gray-400">Keep your routine moving with a quick note.</p>
          <StudySessionForm onSubmit={logSession} />
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </section>

        {!isLoading && <StudyAnalytics sessions={sessions} />}

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Past sessions</h2>
          {isLoading ? (
            <p className="rounded-lg bg-primary px-5 py-8 text-center text-sm text-gray-400">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-700 px-5 py-8 text-center text-sm text-gray-400">
              Your logged sessions will appear here.
            </p>
          ) : (
            <div className="divide-y divide-gray-800 rounded-lg bg-primary">
              {sessions.map(session => (
                <article key={session.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-medium">{session.category}</h3>
                    <time className="text-sm text-gray-500" dateTime={session.createdAt}>
                      {new Date(session.createdAt).toLocaleDateString()}
                    </time>
                  </div>
                  <p className="mt-1 text-sm text-gray-300">{session.durationMinutes} minutes</p>
                  {session.notes && <p className="mt-2 text-sm text-gray-400">{session.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
