import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type GoalMetricType = 'time' | 'puzzles' | 'games';
export type GoalCadence = 'daily' | 'weekly';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  metricType: GoalMetricType;
  cadence: GoalCadence;
  targetNumber: number;
  createdAt: string;
  archivedAt: string | null;
}

interface StudySession {
  durationMinutes: number;
  puzzlesSolved: number;
  gamesPlayed: number;
  createdAt: string;
}

interface GoalsProps {
  userId: string;
  sessions: StudySession[];
  error: string | null;
  onError: (error: string | null) => void;
}

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function formatMetricLabel(type: GoalMetricType, cadence: GoalCadence): string {
  const timeframe = cadence === 'daily' ? 'per day' : 'per week';
  switch (type) {
    case 'time':
      return `minutes ${timeframe}`;
    case 'puzzles':
      return `puzzles ${timeframe}`;
    case 'games':
      return `games ${timeframe}`;
  }
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function ProgressRing({
  progress,
  isActive,
  dayLabel,
}: {
  progress: number;
  isActive: boolean;
  dayLabel: string;
}) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const isComplete = progress >= 100;

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-2">
      <div className={`relative h-12 w-12 sm:h-20 sm:w-20 ${isActive ? 'rounded-full bg-gray-800/50 p-0.5' : ''}`}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 120 120">
          {/* Background ring */}
          <circle cx="60" cy="60" r="45" fill="none" stroke="#374151" strokeWidth="6" />
          {/* Progress ring */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={isComplete ? '#10b981' : '#60a5fa'}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
          />
          {/* Center text */}
          <text
            x="60"
            y="60"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-gray-300 text-sm font-semibold"
          >
            {Math.round(progress)}%
          </text>
        </svg>
      </div>
      <span className={`text-xs font-medium ${isActive ? 'text-accent' : 'text-gray-500'}`}>
        {dayLabel}
      </span>
    </div>
  );
}

function WeeklyProgressCard({
  weeklyProgress,
}: {
  weeklyProgress: number;
}) {
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (weeklyProgress / 100) * circumference;
  const isComplete = weeklyProgress >= 100;

  return (
    <div className="rounded-lg border border-gray-800 bg-primary p-6">
      <div className="flex flex-col items-center gap-6">
        {/* Large cumulative progress ring */}
        <div className="relative h-40 w-40">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle cx="80" cy="80" r="60" fill="none" stroke="#374151" strokeWidth="8" />
            {/* Progress ring */}
            <circle
              cx="80"
              cy="80"
              r="60"
              fill="none"
              stroke={isComplete ? '#10b981' : '#60a5fa'}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
            />
            {/* Center text */}
            <text
              x="80"
              y="70"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-gray-300 text-3xl font-bold"
            >
              {Math.round(weeklyProgress)}%
            </text>
            <text
              x="80"
              y="100"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-gray-400 text-sm"
            >
              This week
            </text>
          </svg>
        </div>

        {/* Progress bar alternative */}
        <div className="w-full">
          <div className="mb-2 flex justify-between">
            <span className="text-sm text-gray-400">Weekly Progress</span>
            <span className="text-sm font-semibold text-gray-300">{Math.round(weeklyProgress)}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full transition-all duration-500 ${
                isComplete ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, weeklyProgress)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NewGoalForm({
  userId,
  onSuccess,
  onCancel,
}: {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [metricType, setMetricType] = useState<GoalMetricType>('time');
  const [cadence, setCadence] = useState<GoalCadence>('daily');
  const [targetNumber, setTargetNumber] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Goal title is required');
      return;
    }

    const target = Number(targetNumber);
    if (!Number.isFinite(target) || target <= 0) {
      setError('Target must be a positive number');
      return;
    }

    setIsSubmitting(true);
    const { error: insertError } = await supabase.from('goals').insert({
      user_id: userId,
      title: title.trim(),
      metric_type: metricType,
      cadence: cadence,
      target_number: target,
      created_at: new Date().toISOString(),
    });

    setIsSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-700 bg-secondary p-4">
      <h3 className="font-semibold">Make a new goal</h3>

      <div>
        <label htmlFor="goal-title" className="mb-2 block text-sm font-medium text-gray-300">
          Goal name
        </label>
        <input
          id="goal-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Daily puzzles"
          className="w-full rounded border border-gray-700 bg-primary px-3 py-2 text-white focus:border-accent focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="goal-metric" className="mb-2 block text-sm font-medium text-gray-300">
            Metric
          </label>
          <select
            id="goal-metric"
            value={metricType}
            onChange={e => setMetricType(e.target.value as GoalMetricType)}
            className="w-full rounded border border-gray-700 bg-primary px-3 py-2 text-white focus:border-accent focus:outline-none"
          >
            <option value="time">Study time (min)</option>
            <option value="puzzles">Puzzles</option>
            <option value="games">Games</option>
          </select>
        </div>

        <div>
          <label htmlFor="goal-cadence" className="mb-2 block text-sm font-medium text-gray-300">
            Frequency
          </label>
          <select
            id="goal-cadence"
            value={cadence}
            onChange={e => setCadence(e.target.value as GoalCadence)}
            className="w-full rounded border border-gray-700 bg-primary px-3 py-2 text-white focus:border-accent focus:outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="goal-target" className="mb-2 block text-sm font-medium text-gray-300">
          Target ({cadence === 'daily' ? 'per day' : 'per week'})
        </label>
        <input
          id="goal-target"
          type="number"
          min="1"
          step="1"
          value={targetNumber}
          onChange={e => setTargetNumber(e.target.value)}
          className="w-full rounded border border-gray-700 bg-primary px-3 py-2 text-white focus:border-accent focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded bg-accent py-2 font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded bg-gray-700 py-2 font-semibold text-white transition hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function GoalCard({
  goal,
  weeklyProgress,
  userId,
  onUpdate,
  onError,
}: {
  goal: Goal;
  weeklyProgress: number[];
  userId: string;
  onUpdate: () => void;
  onError: (err: string) => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const today = new Date();
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // Convert to 0=Monday

  async function handleDelete() {
    setShowDeleteConfirm(false);
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goal.id)
      .eq('user_id', userId);

    if (error) {
      onError(error.message);
      return;
    }

    onUpdate();
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-primary p-4 sm:p-6">
      <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:mb-6 sm:flex-row sm:gap-0">
        <div>
          <h3 className="text-sm font-semibold text-white sm:text-base">{goal.title}</h3>
          <p className="mt-1 text-xs uppercase tracking-wider text-gray-400">
            {goal.targetNumber} {formatMetricLabel(goal.metricType, goal.cadence)}
          </p>
        </div>
        {showDeleteConfirm && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="text-red-400 underline transition hover:text-red-300"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="text-gray-400 underline transition hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        )}
        {!showDeleteConfirm && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs text-gray-500 transition hover:text-red-400"
          >
            Delete
          </button>
        )}
      </div>

      {/* Daily progress: 7-day rings */}
      {goal.cadence === 'daily' && (
        <div className="flex justify-between gap-1 sm:gap-4">
          {weeklyProgress.map((progress, index) => (
            <ProgressRing
              key={index}
              progress={progress}
              isActive={index === todayIndex}
              dayLabel={dayLabels[index]}
            />
          ))}
        </div>
      )}

      {/* Weekly progress: cumulative card */}
      {goal.cadence === 'weekly' && (
        <WeeklyProgressCard weeklyProgress={weeklyProgress[0]} />
      )}
    </div>
  );
}

export function Goals({
  userId,
  sessions,
  error,
  onError,
}: GoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    void fetchGoals();
  }, [userId]);

  async function fetchGoals() {
    setIsLoading(true);
    onError(null);

    const { data, error: fetchError } = await supabase
      .from('goals')
      .select('id, user_id, title, metric_type, cadence, target_number, created_at, archived_at')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: true });

    if (fetchError) {
      onError(fetchError.message);
      setIsLoading(false);
      return;
    }

    const goalsData: Goal[] = (data || []).map(g => ({
      id: g.id,
      userId: g.user_id,
      title: g.title,
      metricType: g.metric_type as GoalMetricType,
      cadence: (g.cadence as GoalCadence) || 'daily',
      targetNumber: g.target_number,
      createdAt: g.created_at,
      archivedAt: g.archived_at,
    }));

    setGoals(goalsData);
    setIsLoading(false);
  }

  function calculateWeeklyProgress(goal: Goal): number[] {
    const today = startOfDay(new Date());
    
    // Get past 7 days (Monday to Sunday of current week)
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1; // Convert to 0=Monday
    const mondayOfWeek = new Date(today);
    mondayOfWeek.setDate(today.getDate() - dayOfWeek);

    if (goal.cadence === 'daily') {
      // For daily goals, return progress for each day of the week
      const weekProgress: number[] = [];
      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(mondayOfWeek);
        dayStart.setDate(mondayOfWeek.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);

        // Filter sessions for this day
        const daySessions = sessions.filter(session => {
          const sessionDate = new Date(session.createdAt);
          return sessionDate >= dayStart && sessionDate < dayEnd;
        });

        let dayTotal = 0;
        switch (goal.metricType) {
          case 'time':
            dayTotal = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
            break;
          case 'puzzles':
            dayTotal = daySessions.reduce((sum, s) => sum + s.puzzlesSolved, 0);
            break;
          case 'games':
            dayTotal = daySessions.reduce((sum, s) => sum + s.gamesPlayed, 0);
            break;
        }

        const progressPercent = (dayTotal / goal.targetNumber) * 100;
        weekProgress.push(Math.min(100, progressPercent));
      }
      return weekProgress;
    } else {
      // For weekly goals, return cumulative progress for the entire week
      const sundayOfWeek = new Date(mondayOfWeek);
      sundayOfWeek.setDate(mondayOfWeek.getDate() + 7);

      // Filter sessions for the entire week
      const weekSessions = sessions.filter(session => {
        const sessionDate = new Date(session.createdAt);
        return sessionDate >= mondayOfWeek && sessionDate < sundayOfWeek;
      });

      let weekTotal = 0;
      switch (goal.metricType) {
        case 'time':
          weekTotal = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
          break;
        case 'puzzles':
          weekTotal = weekSessions.reduce((sum, s) => sum + s.puzzlesSolved, 0);
          break;
        case 'games':
          weekTotal = weekSessions.reduce((sum, s) => sum + s.gamesPlayed, 0);
          break;
      }

      const progressPercent = (weekTotal / goal.targetNumber) * 100;
      return [Math.min(100, progressPercent)];
    }
  }

  if (isLoading) {
    return null;
  }

  const hasGoals = goals.length > 0;

  return (
    <section className="mb-8">
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {hasGoals && (
        <div className="mb-6 space-y-4">
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              weeklyProgress={calculateWeeklyProgress(goal)}
              userId={userId}
              onUpdate={() => {
                void fetchGoals();
              }}
              onError={onError}
            />
          ))}
        </div>
      )}

      {showNewForm && (
        <div className="mb-6">
          <NewGoalForm
            userId={userId}
            onSuccess={() => {
              setShowNewForm(false);
              void fetchGoals();
            }}
            onCancel={() => setShowNewForm(false)}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowNewForm(!showNewForm)}
        className="text-sm text-gray-400 underline transition hover:text-gray-300"
      >
        {showNewForm ? 'Cancel' : '+ Make a new goal'}
      </button>
    </section>
  );
}
