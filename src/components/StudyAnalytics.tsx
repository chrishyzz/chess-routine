import { useState, useRef, useEffect } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { StudyCategory } from './StudySessionForm';

export interface AnalyticsSession {
  category: StudyCategory;
  durationMinutes: number;
  createdAt: string;
}

interface StudyAnalyticsProps {
  sessions: AnalyticsSession[];
}

const categoryColors: Record<StudyCategory, string> = {
  'Games & analysis': '#60a5fa',
  Tactics: '#a78bfa',
  Endgame: '#34d399',
  Middlegame: '#fbbf24',
  Openings: '#f87171',
};

const categories = Object.keys(categoryColors) as StudyCategory[];
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function normalizeCategory(category: string): StudyCategory | null {
  const legacyCategories: Record<string, StudyCategory> = {
    Puzzles: 'Tactics',
    puzzles: 'Tactics',
    opening: 'Openings',
    openings: 'Openings',
    endgame: 'Endgame',
    games: 'Games & analysis',
    tactics: 'Tactics',
    play: 'Games & analysis',
    study: 'Openings',
  };

  if (categories.includes(category as StudyCategory)) {
    return category as StudyCategory;
  }

  return legacyCategories[category] || null;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfWeek(date: Date) {
  const result = startOfDay(date);
  const daysSinceMonday = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - daysSinceMonday);
  return result;
}

function Heatmap({ sessions }: StudyAnalyticsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const today = startOfDay(new Date());
  const currentWeekStart = startOfWeek(today);
  const firstWeekStart = new Date(currentWeekStart);
  firstWeekStart.setDate(firstWeekStart.getDate() - 15 * 7);
  const weeks = Array.from({ length: 16 }, (_, weekIndex) => {
    const weekStart = new Date(firstWeekStart);
    weekStart.setDate(firstWeekStart.getDate() + weekIndex * 7);
    return weekStart;
  });
  const days = weeks.flatMap(weekStart => dayLabels.map((_, dayIndex) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);
    return date <= today ? date : null;
  }));

  const minutesByDay = sessions.reduce<Record<string, number>>((totals, session) => {
    const key = dateKey(new Date(session.createdAt));
    totals[key] = (totals[key] || 0) + session.durationMinutes;
    return totals;
  }, {});

  const visibleMinutes = days
    .filter((day): day is Date => day !== null)
    .map(day => minutesByDay[dateKey(day)] || 0);
  const maxMinutes = Math.max(1, ...visibleMinutes);
  const getIntensity = (minutes: number) => {
    if (minutes === 0) return 'bg-gray-800';
   if (minutes <= maxMinutes * 0.25) return 'bg-amber-950';
if (minutes <= maxMinutes * 0.5) return 'bg-amber-800';
if (minutes <= maxMinutes * 0.75) return 'bg-amber-600';
return 'bg-amber-400';
  };

  // Anchor scroll to the right on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;
      // Use setTimeout to ensure scrollWidth is available after render
      setTimeout(() => {
        scrollContainer.scrollLeft = scrollContainer.scrollWidth;
      }, 0);
    }
  }, []);

  return (
    <section className="rounded-lg bg-primary p-4">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Daily activity</h2>
          <p className="mt-1 text-sm text-gray-400">Minutes logged over the last 16 weeks</p>
        </div>
        <div className="hidden items-center gap-1 text-xs text-gray-500 sm:flex">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map(level => (
            <span key={level} className={`h-3 w-3 rounded-sm ${getIntensity(level === 0 ? 0 : maxMinutes * level / 4)}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-1 sm:gap-2">
        {/* Fixed day labels on the left */}
        <div className="grid w-5 shrink-0 grid-rows-7 gap-0.5 text-[10px] text-gray-500 sm:w-7 sm:gap-1 sm:text-xs">
          {dayLabels.map((label, index) => <span key={label} className={index % 2 === 1 ? '' : 'invisible'}>{label}</span>)}
        </div>

        {/* Scrollable section containing month labels and grid */}
        <div 
          ref={scrollContainerRef}
          className="relative flex-1 overflow-x-auto pb-2"
        >
          {/* Fade overlay on the left to hint at more history */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-primary to-transparent z-10" />
          
          <div className="min-w-0">
            {/* Month labels - inside scrollable container */}
            <div className="mb-2 inline-grid grid-cols-[repeat(16,minmax(0,1fr))] gap-0.5 text-[10px] text-gray-500 sm:gap-1 sm:text-xs whitespace-nowrap">
              {weeks.map((weekStart, weekIndex) => {
                const previousWeek = weeks[weekIndex - 1];
                const isFirstWeekOfMonth = !previousWeek || weekStart.getMonth() !== previousWeek.getMonth();
                return isFirstWeekOfMonth ? (
                  <span key={dateKey(weekStart)} className="justify-self-center">
                    {weekStart.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                ) : <span key={dateKey(weekStart)} />;
              })}
            </div>

            {/* Heatmap grid */}
            <div className="inline-grid grid-flow-col grid-cols-[repeat(16,minmax(0,1fr))] grid-rows-7 gap-0.5 sm:gap-1">
              {days.map((day, index) => {
                const isFuture = day === null;
                const minutes = day === null ? 0 : minutesByDay[dateKey(day)] || 0;
                return (
                  <span
                    key={day ? dateKey(day) : `future-${index}`}
                    title={day ? `${day.toLocaleDateString()}: ${minutes} minutes` : undefined}
                    className={`block h-4 w-4 justify-self-center rounded-sm border border-gray-700/70 sm:h-5 sm:w-5 ${isFuture ? 'bg-gray-900/50' : getIntensity(minutes)}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryPie({ sessions }: StudyAnalyticsProps) {
  const [range, setRange] = useState<'7d' | 'all'>('7d');
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const filteredSessions = range === 'all'
    ? sessions
    : sessions.filter(session => new Date(session.createdAt).getTime() >= cutoff);
  const totals = categories.map(category => ({
    name: category,
    value: filteredSessions
      .filter(session => normalizeCategory(session.category) === category)
      .reduce((sum, session) => sum + session.durationMinutes, 0),
  })).filter(item => item.value > 0);
  const totalMinutes = totals.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="min-w-0 overflow-hidden rounded-lg bg-primary p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Time by category</h2>
          <p className="mt-1 text-base text-gray-400">{totalMinutes} minutes logged</p>
        </div>
        <div className="flex rounded border border-gray-700 p-0.5 text-sm">
          {([['7d', 'Last 7 Days'], ['all', 'All Time']] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={`rounded px-3 py-1.5 transition ${range === value ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {totals.length === 0 ? (
        <p className="flex h-64 items-center justify-center text-sm text-gray-500">No activity in this period.</p>
      ) : (
        <div className="flex min-w-0 flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="relative mx-auto h-52 w-full max-w-[18rem] min-w-0 overflow-hidden sm:h-64 sm:max-w-none sm:flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={totals} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="78%" paddingAngle={2}>
                  {totals.map(item => <Cell key={item.name} fill={categoryColors[item.name as StudyCategory]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} min`, 'Study time']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full min-w-0 space-y-2 text-sm sm:w-auto sm:space-y-3 sm:text-base">
            {totals.map(item => (
              <div key={item.name} className="flex items-center justify-between gap-3 leading-6">
                <span className="flex min-w-0 items-center gap-2 text-gray-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColors[item.name as StudyCategory] }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="shrink-0 text-gray-400">{Math.round(item.value / totalMinutes * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function StudyAnalytics({ sessions }: StudyAnalyticsProps) {
  return (
    <div className="mt-8 grid gap-6">
      <Heatmap sessions={sessions} />
      <CategoryPie sessions={sessions} />
    </div>
  );
}
