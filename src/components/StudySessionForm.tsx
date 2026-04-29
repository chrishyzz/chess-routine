import { useState } from 'react';

interface StudySessionFormProps {
  onSubmit: (session: {
    type: 'puzzles' | 'opening' | 'endgame' | 'games' | 'tactics';
    duration: number;
    puzzlesSolved: number;
    date: string;
    notes: string;
  }) => void;
  onCancel: () => void;
}

export function StudySessionForm({ onSubmit, onCancel }: StudySessionFormProps) {
  const [type, setType] = useState<'puzzles' | 'opening' | 'endgame' | 'games' | 'tactics'>('puzzles');
  const [duration, setDuration] = useState(30);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!duration || duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }
    if (puzzlesSolved < 0) {
      newErrors.puzzlesSolved = 'Cannot be negative';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      type,
      duration,
      puzzlesSolved,
      date,
      notes,
    });

    // Reset form
    setType('puzzles');
    setDuration(30);
    setPuzzlesSolved(0);
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setErrors({});
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Study Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as 'puzzles' | 'opening' | 'endgame' | 'games' | 'tactics')}
            className="w-full bg-secondary border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
          >
            <option value="puzzles">Puzzles</option>
            <option value="opening">Opening</option>
            <option value="endgame">Endgame</option>
            <option value="games">Games</option>
            <option value="tactics">Tactics</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-secondary border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(Math.max(0, parseInt(e.target.value) || 0))}
            min="1"
            className="w-full bg-secondary border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
          />
          {errors.duration && <p className="text-red-400 text-xs mt-1">{errors.duration}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Puzzles Solved</label>
          <input
            type="number"
            value={puzzlesSolved}
            onChange={e => setPuzzlesSolved(Math.max(0, parseInt(e.target.value) || 0))}
            min="0"
            className="w-full bg-secondary border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
          />
          {errors.puzzlesSolved && <p className="text-red-400 text-xs mt-1">{errors.puzzlesSolved}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="What did you focus on today?"
          rows={3}
          className="w-full bg-secondary border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-accent hover:bg-blue-600 text-white font-semibold py-2 rounded transition"
        >
          Save Session
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
