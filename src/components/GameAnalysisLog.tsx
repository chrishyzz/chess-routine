import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';

type GameResult = 'Win' | 'Loss' | 'Draw';

interface GameLog {
  id: string;
  created_at: string;
  lichess_username?: string | null;
  lichess_url: string | null;
  game_result: GameResult | null;
  rating_opening: number;
  rating_middlegame: number | null;
  rating_endgame: number | null;
  mistake_tags: string[];
  focus_rating: number;
  narrative_note: string | null;
}

interface GameLogDraft {
  lichess_url: string;
  game_result: GameResult | '';
  rating_opening: number;
  rating_middlegame: number | null;
  rating_endgame: number | null;
  mistake_tags: string[];
  focus_rating: number;
  narrative_note: string;
}

const guestLogsKey = 'chess-routine-game-logs';

const categories = [
  {
    name: 'Opening',
    tags: [
      'Repertoire Failure: Forgot known line / gap needs fixing',
      'Mishandled Structure: Conceptual gap in resulting middlegame',
    ],
  },
  {
    name: 'Tactics',
    tags: [
      'Blunder: Defensive oversight / hanging material',
      'Blind Spot: Missed attack or opportunity',
    ],
  },
  {
    name: 'Calculation',
    tags: [
      'Mistaken Visualisation: Concrete error or evaluation',
      'Lack of Precision: Saw the right idea, got a detail wrong',
    ],
  },
  {
    name: 'Strategy',
    tags: [
      "Pursued Wrong Plan: Active misreading of the structure or position",
      "Prophylactic Failure: Blind to opponent's plan / missed counterplay",
    ],
  },
  {
    name: 'Endgame',
    tags: [
      'Theoretical Knowledge Gap: Textbooks/rules failure (Lucena, opposition, etc.)',
      'Schematic Error: Wrong king route, pawn break, or piece conversion plan',
    ],
  },
  {
    name: 'Clock',
    tags: ['Time-Pressure: Spent too long with decision making'],
  },
] as const;

const initialDraft: GameLogDraft = {
  lichess_url: '',
  game_result: '',
  rating_opening: 5,
  rating_middlegame: 5,
  rating_endgame: 5,
  mistake_tags: [],
  focus_rating: 50,
  narrative_note: '',
};

function isGameLog(value: unknown): value is GameLog {
  if (typeof value !== 'object' || value === null) return false;
  const log = value as Record<string, unknown>;
  return typeof log.id === 'string'
    && typeof log.created_at === 'string'
    && (typeof log.lichess_username === 'string' || log.lichess_username === null || log.lichess_username === undefined)
    && (typeof log.lichess_url === 'string' || log.lichess_url === null)
    && (log.game_result === 'Win' || log.game_result === 'Loss' || log.game_result === 'Draw' || log.game_result === null)
    && typeof log.rating_opening === 'number'
    && (typeof log.rating_middlegame === 'number' || log.rating_middlegame === null)
    && (typeof log.rating_endgame === 'number' || log.rating_endgame === null)
    && Array.isArray(log.mistake_tags)
    && log.mistake_tags.every(tag => typeof tag === 'string')
    && typeof log.focus_rating === 'number'
    && (typeof log.narrative_note === 'string' || log.narrative_note === null);
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(logs: GameLog[]) {
  const columns: (keyof GameLog)[] = [
    'id',
    'created_at',
    'lichess_username',
    'lichess_url',
    'game_result',
    'rating_opening',
    'rating_middlegame',
    'rating_endgame',
    'mistake_tags',
    'focus_rating',
    'narrative_note',
  ];
  const rows = logs.map(log => columns.map(column => escapeCsvCell(
    column === 'mistake_tags' ? log.mistake_tags.join('; ') : log[column] as string | number | null,
  )).join(','));
  const csv = [columns.join(','), ...rows].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'chess-game-logs.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function GameAnalysisLog() {
  const { user: lichessUser } = useAuth();
  const [draft, setDraft] = useState<GameLogDraft>(initialDraft);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeUsername = lichessUser?.username.trim() || null;

  function closeModal() {
    setIsOpen(false);
    setDraft(initialDraft);
    setError(null);
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeModal();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;
    let loadSequence = 0;

    async function loadLogs(lichessUsername: string | null) {
      const currentLoad = ++loadSequence;
      setIsLoading(true);
      setError(null);

      try {
        if (!lichessUsername) {
          const storedLogs = localStorage.getItem(guestLogsKey);
          const parsed: unknown = storedLogs ? JSON.parse(storedLogs) : [];
          if (!Array.isArray(parsed) || !parsed.every(isGameLog)) {
            throw new Error('Saved guest game logs have an invalid format.');
          }
          if (isMounted && loadSequence === currentLoad) setLogs(parsed);
          return;
        }

        const allLogs: GameLog[] = [];
        const pageSize = 1000;
        for (let offset = 0; ; offset += pageSize) {
          const { data, error: fetchError } = await supabase
            .from('game_logs')
            .select('id, created_at, lichess_username, lichess_url, game_result, rating_opening, rating_middlegame, rating_endgame, mistake_tags, focus_rating, narrative_note')
            .eq('lichess_username', lichessUsername)
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1);
          if (fetchError) throw fetchError;
          allLogs.push(...(data as GameLog[]));
          if (data.length < pageSize) break;
        }
        if (isMounted && loadSequence === currentLoad) setLogs(allLogs);
      } catch (loadError) {
        if (isMounted && loadSequence === currentLoad) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load game logs.');
        }
      } finally {
        if (isMounted && loadSequence === currentLoad) setIsLoading(false);
      }
    }

    void loadLogs(activeUsername);

    return () => {
      isMounted = false;
    };
  }, [activeUsername]);

  function updateDraft<Key extends keyof GameLogDraft>(key: Key, value: GameLogDraft[Key]) {
    setDraft(current => ({ ...current, [key]: value }));
  }

  function toggleTag(tag: string) {
    setDraft(current => ({
      ...current,
      mistake_tags: current.mistake_tags.includes(tag)
        ? current.mistake_tags.filter(selectedTag => selectedTag !== tag)
        : [...current.mistake_tags, tag],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    setIsSaving(true);
    const lichessUsername = activeUsername;
    const log: GameLog = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      lichess_username: lichessUsername,
      lichess_url: draft.lichess_url.trim() || null,
      game_result: draft.game_result || null,
      rating_opening: draft.rating_opening,
      rating_middlegame: draft.rating_middlegame,
      rating_endgame: draft.rating_endgame,
      mistake_tags: draft.mistake_tags,
      focus_rating: draft.focus_rating,
      narrative_note: draft.narrative_note.trim() || null,
    };
    try {
      if (!lichessUsername) {
        const updatedLogs = [log, ...logs];
        localStorage.setItem(guestLogsKey, JSON.stringify(updatedLogs));
        setLogs(updatedLogs);
      } else {
        const payload = {
          lichess_username: lichessUser?.username || null,
          lichess_url: draft.lichess_url.trim() || null,
          game_result: draft.game_result || null,
          rating_opening: draft.rating_opening,
          rating_middlegame: draft.rating_middlegame,
          rating_endgame: draft.rating_endgame,
          mistake_tags: draft.mistake_tags,
          focus_rating: draft.focus_rating,
          narrative_note: draft.narrative_note.trim() || null,
        };
        const { data, error: insertError } = await supabase
          .from('game_logs')
          .insert([payload])
          .select('id, created_at, lichess_username, lichess_url, game_result, rating_opening, rating_middlegame, rating_endgame, mistake_tags, focus_rating, narrative_note')
          .single();
        if (insertError) throw insertError;
        setLogs(current => [data as GameLog, ...current.filter(existingLog => existingLog.id !== data.id)]);
      }
      closeModal();
    } catch (saveError) {
      console.error('Failed to save game log:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this game log.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <section className="mb-6">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative w-full overflow-hidden rounded-lg border border-gray-800 bg-primary/60 px-4 py-4 text-center font-semibold text-gray-100 transition duration-300 hover:border-[#c8a96e]/40 hover:bg-primary/80"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(200, 169, 110, 0.09) 0%, rgba(200, 169, 110, 0.025) 100%)',
          }}
        >
          <span className="relative z-10">Post-game analysis</span>
        </button>
      </section>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={event => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-analysis-title"
            className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-t-xl border border-gray-700 bg-primary p-4 shadow-2xl sm:rounded-xl sm:p-6"
          >
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="game-analysis-title" className="text-xl font-semibold">Post-game analysis</h2>
                <p className="mt-1 text-sm text-gray-400">
                  {activeUsername
                    ? `Logging as @${activeUsername}`
                    : 'Guest mode · game logs are saved on this device only'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => downloadCsv(logs)}
                  disabled={logs.length === 0}
                  className="rounded border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close post-game analysis"
                  className="rounded border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>

            {isLoading ? (
              <p className="text-sm text-gray-400">Loading saved game logs...</p>
            ) : (
              <form onSubmit={event => void handleSubmit(event)} className="space-y-7">
                <fieldset className="space-y-4">
                  <legend className="mb-3 text-base font-semibold">A. Game Link</legend>
                  <div>
                    <label htmlFor="game-lichess-url" className="mb-2 block text-sm font-medium text-gray-300">
                      Lichess game or study link <span className="font-normal text-gray-500">(optional)</span>
                    </label>
                    <input
                      id="game-lichess-url"
                      type="url"
                      value={draft.lichess_url}
                      onChange={event => updateDraft('lichess_url', event.target.value)}
                      placeholder="https://lichess.org/..."
                      className="w-full rounded border border-gray-700 bg-secondary px-3 py-2 text-white focus:border-accent focus:outline-none"
                    />
                  </div>
                  <fieldset>
                    <legend className="mb-2 block text-sm font-medium text-gray-300">Result</legend>
                    <div className="flex flex-wrap gap-2">
                      {(['Win', 'Loss', 'Draw'] as const).map(result => (
                        <label key={result} className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition ${draft.game_result === result ? 'border-accent bg-accent/15 text-white' : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}>
                          <input
                            type="radio"
                            name="game-result"
                            value={result}
                            checked={draft.game_result === result}
                            onChange={() => updateDraft('game_result', result)}
                            className="sr-only"
                          />
                          {result}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </fieldset>

                <fieldset className="space-y-5">
                  <legend className="mb-1 text-base font-semibold">B. Phase Ratings</legend>
                  {([
                    ['Opening', 'rating_opening'],
                    ['Middlegame', 'rating_middlegame'],
                    ['Endgame', 'rating_endgame'],
                  ] as const).map(([phase, key]) => {
                    const isOptionalPhase = key !== 'rating_opening';
                    const value = draft[key];
                    return (
                      <div key={key}>
                        <label htmlFor={key} className="mb-2 block text-sm font-medium text-gray-300">{phase}</label>
                        <div className="flex items-center gap-3">
                          <div className={`min-w-0 flex-1 ${value === null ? 'opacity-50' : ''}`}>
                            <input
                              id={key}
                              type="range"
                              min="1"
                              max="10"
                              step="1"
                              value={value ?? 5}
                              disabled={value === null}
                              onChange={event => updateDraft(key, Number(event.target.value))}
                              className="w-full cursor-pointer accent-accent disabled:cursor-not-allowed"
                              aria-label={`${phase} performance`}
                            />
                            <div className="flex justify-between text-xs text-gray-500" aria-hidden="true">
                              <span>Badly</span>
                              <span>Okay</span>
                              <span>Great</span>
                            </div>
                          </div>
                          {isOptionalPhase && (
                            <button
                              type="button"
                              aria-pressed={value === null}
                              onClick={() => updateDraft(key, value === null ? 5 : null)}
                              className={`rounded border px-2.5 py-1 text-xs transition ${value === null ? 'border-accent bg-accent/15 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'}`}
                            >
                              N/a
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="mb-1 text-base font-semibold">C. Patterns</legend>
                  {categories.map(category => (
                    <section key={category.name} className="rounded border border-gray-800 bg-secondary/50 px-3 py-3">
                      <h3 className="mb-3 text-sm font-semibold text-gray-200">{category.name}</h3>
                      <div className="space-y-3">
                        {category.tags.map(tag => (
                          <label key={tag} className="flex cursor-pointer items-start gap-3 text-sm text-gray-300">
                            <input
                              type="checkbox"
                              checked={draft.mistake_tags.includes(tag)}
                              onChange={() => toggleTag(tag)}
                              className="mt-0.5 accent-accent"
                            />
                            <span>{tag}</span>
                          </label>
                        ))}
                      </div>
                    </section>
                  ))}
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-base font-semibold">D. Focus &amp; reflection</legend>
                  <label htmlFor="game-focus-rating" className="mb-2 block text-sm font-medium text-gray-300">Focus / energy</label>
                  <input
                    id="game-focus-rating"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={draft.focus_rating}
                    onChange={event => updateDraft('focus_rating', Number(event.target.value))}
                    className="w-full cursor-pointer accent-accent"
                    aria-label="Focus and energy"
                  />
                  <div className="flex justify-between gap-4 text-xs text-gray-500">
                    <span>Exhausted &amp; Distracted</span>
                    <span className="text-right">Refreshed &amp; Focused</span>
                  </div>
                  <div className="mt-5">
                    <label htmlFor="game-narrative-note" className="mb-2 block text-sm font-medium text-gray-300">
                      Reflection <span className="font-normal text-gray-500">(optional, up to 300 characters)</span>
                    </label>
                    <textarea
                      id="game-narrative-note"
                      rows={3}
                      maxLength={300}
                      value={draft.narrative_note}
                      onChange={event => updateDraft('narrative_note', event.target.value)}
                      placeholder="What would you like to remember from this game?"
                      className="w-full resize-y rounded border border-gray-700 bg-secondary px-3 py-2 text-white focus:border-accent focus:outline-none"
                    />
                  </div>
                </fieldset>

                {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full rounded bg-accent px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                >
                  {isSaving ? 'Saving...' : 'Save game analysis'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
