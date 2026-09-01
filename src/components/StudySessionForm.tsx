import { useState } from 'react';

export type StudyCategory = 'Games & analysis' | 'Tactics' | 'Endgame' | 'Middlegame' | 'Openings';

interface StudySessionFormProps {
  onSubmit: (session: { category: StudyCategory; durationMinutes: number; puzzlesSolved: number; gamesPlayed: number; notes: string }) => void;
}

const categories: StudyCategory[] = ['Games & analysis', 'Tactics', 'Endgame', 'Middlegame', 'Openings'];

export function StudySessionForm({ onSubmit }: StudySessionFormProps) {
  const [category, setCategory] = useState<StudyCategory>('Games & analysis');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [puzzlesSolved, setPuzzlesSolved] = useState('0');
  const [gamesPlayed, setGamesPlayed] = useState('0');
  const [notes, setNotes] = useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const duration = Number(durationMinutes);
    const puzzles = Number(puzzlesSolved);
    const games = Number(gamesPlayed);

    if (!Number.isFinite(duration) || duration <= 0) {
      return;
    }

    onSubmit({ category, durationMinutes: duration, puzzlesSolved: puzzles, gamesPlayed: games, notes: notes.trim() });
    setCategory('Games & analysis');
    setDurationMinutes('30');
    setPuzzlesSolved('0');
    setGamesPlayed('0');
    setNotes('');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="study-category" className="mb-2 block text-sm font-medium text-gray-300">Category</label>
        <select
          id="study-category"
          value={category}
          onChange={event => setCategory(event.target.value as StudyCategory)}
          className="w-full rounded border border-gray-700 bg-secondary px-3 py-2 text-white focus:border-accent focus:outline-none"
        >
          {categories.map(option => <option key={option}>{option}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="duration-minutes" className="mb-2 block text-sm font-medium text-gray-300">Time Spent (minutes)</label>
        <input
          id="duration-minutes"
          type="number"
          min="1"
          step="1"
          required
          value={durationMinutes}
          onChange={event => setDurationMinutes(event.target.value)}
          className="w-full rounded border border-gray-700 bg-secondary px-3 py-2 text-white focus:border-accent focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="puzzles-solved" className="mb-2 block text-sm font-medium text-gray-300">
            Puzzles solved <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input
            id="puzzles-solved"
            type="number"
            min="0"
            step="1"
            value={puzzlesSolved}
            onChange={event => setPuzzlesSolved(event.target.value)}
            className="w-full rounded border border-gray-700 bg-secondary px-3 py-2 text-white focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="games-played" className="mb-2 block text-sm font-medium text-gray-300">
            Games played <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input
            id="games-played"
            type="number"
            min="0"
            step="1"
            value={gamesPlayed}
            onChange={event => setGamesPlayed(event.target.value)}
            className="w-full rounded border border-gray-700 bg-secondary px-3 py-2 text-white focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="study-notes" className="mb-2 block text-sm font-medium text-gray-300">
          Notes <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          id="study-notes"
          rows={4}
          value={notes}
          onChange={event => setNotes(event.target.value)}
          placeholder="What did you work on?"
          className="w-full resize-none rounded border border-gray-700 bg-secondary px-3 py-2 text-white focus:border-accent focus:outline-none"
        />
      </div>

       <div className="flex justify-center">
        <button type="submit" className="rounded bg-accent px-6 py-2.5 font-semibold text-white transition hover:opacity-90">
          Log Session
        </button>
      </div>
    </form>
  );
}
