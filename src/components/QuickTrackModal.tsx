import { useState } from 'react';

interface QuickTrackModalProps {
  onSubmit: (track: {
    taskName: string;
    trackType: 'quantity' | 'duration';
    value: number;
  }) => void;
  onCancel: () => void;
}

export function QuickTrackModal({ onSubmit, onCancel }: QuickTrackModalProps) {
  const [taskName, setTaskName] = useState('');
  const [trackType, setTrackType] = useState<'quantity' | 'duration'>('quantity');
  const [value, setValue] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!taskName.trim()) {
      newErrors.taskName = 'Task name is required';
    }
    if (!value || value <= 0) {
      newErrors.value = 'Value must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      taskName: taskName.trim(),
      trackType,
      value,
    });

    // Reset form
    setTaskName('');
    setTrackType('quantity');
    setValue(1);
    setErrors({});
  }

  return (
    <div className="bg-primary rounded-lg p-6 mt-4">
      <h3 className="text-lg font-semibold mb-4">Quick Track</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Task Name</label>
          <input
            type="text"
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
            placeholder="e.g., Rapid Game, Puzzle Streak"
            className="w-full bg-secondary border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
          />
          {errors.taskName && <p className="text-red-400 text-xs mt-1">{errors.taskName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Track by</label>
            <select
              value={trackType}
              onChange={e => setTrackType(e.target.value as 'quantity' | 'duration')}
              className="w-full bg-secondary border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
            >
              <option value="quantity">Quantity</option>
              <option value="duration">Duration</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {trackType === 'quantity' ? 'Number of items' : 'Minutes'}
            </label>
            <input
              type="number"
              value={value}
              onChange={e => setValue(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="w-full bg-secondary border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
            />
            {errors.value && <p className="text-red-400 text-xs mt-1">{errors.value}</p>}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            Save Track
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}