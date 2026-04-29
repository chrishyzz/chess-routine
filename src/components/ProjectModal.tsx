import { useState } from 'react';

interface ProjectModalProps {
  onSubmit: (project: {
    title: string;
    totalGoal: number;
    unitName: string;
  }) => void;
  onCancel: () => void;
}

export function ProjectModal({ onSubmit, onCancel }: ProjectModalProps) {
  const [title, setTitle] = useState('');
  const [totalGoal, setTotalGoal] = useState(10);
  const [unitName, setUnitName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Project title is required';
    }
    if (!totalGoal || totalGoal <= 0) {
      newErrors.totalGoal = 'Total goal must be greater than 0';
    }
    if (!unitName.trim()) {
      newErrors.unitName = 'Unit name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      title: title.trim(),
      totalGoal,
      unitName: unitName.trim(),
    });

    // Reset form
    setTitle('');
    setTotalGoal(10);
    setUnitName('');
    setErrors({});
  }

  return (
    <div className="bg-primary rounded-lg p-6 mt-4">
      <h3 className="text-lg font-semibold mb-4">Set Project</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Project Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Reading 'My System' - 150 pages"
            className="w-full bg-secondary border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
          />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Total Goal</label>
            <input
              type="number"
              value={totalGoal}
              onChange={e => setTotalGoal(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="w-full bg-secondary border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
            />
            {errors.totalGoal && <p className="text-red-400 text-xs mt-1">{errors.totalGoal}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Unit Name</label>
            <input
              type="text"
              value={unitName}
              onChange={e => setUnitName(e.target.value)}
              placeholder="e.g., pages, chapters, games"
              className="w-full bg-secondary border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-accent"
            />
            {errors.unitName && <p className="text-red-400 text-xs mt-1">{errors.unitName}</p>}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
          >
            Create Project
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