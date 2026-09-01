import { useState, useRef, useEffect } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StudyCategory } from './StudySessionForm';

export interface AnalyticsSession {
  category: StudyCategory;
  durationMinutes: number;
  createdAt: string;
  puzzlesSolved?: number;
  gamesPlayed?: number;
}

interface StudyAnalyticsProps {
  sessions: AnalyticsSession[];
}

export const categoryColors: Record<StudyCategory, string> = {
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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 };
}

function hexToRgba(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function Pace({ sessions }: StudyAnalyticsProps) {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const today = startOfDay(new Date());
  const daysBack = range === '7d' ? 7 : 30;
  const cutoffDate = new Date(today);
  cutoffDate.setDate(today.getDate() - daysBack);

  // Filter sessions in the range
  const filteredSessions = sessions.filter(session => {
    const sessionDate = startOfDay(new Date(session.createdAt));
    return sessionDate >= cutoffDate && sessionDate <= today;
  });

  // Calculate totals
  const totalPuzzles = filteredSessions.reduce((sum, s) => sum + (s.puzzlesSolved || 0), 0);
  const totalGames = filteredSessions.reduce((sum, s) => sum + (s.gamesPlayed || 0), 0);
  const totalMinutes = filteredSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  // Count days with any activity (study time, puzzles, or games)
  const daysWithData = new Set(
    filteredSessions
      .filter(s => s.durationMinutes > 0 || (s.puzzlesSolved || 0) > 0 || (s.gamesPlayed || 0) > 0)
      .map(s => dateKey(new Date(s.createdAt)))
  ).size;

  // Hide section entirely if no data at all
  if (totalMinutes === 0 && totalPuzzles === 0 && totalGames === 0) {
    return null;
  }

  // Calculate averages per day
  const avgPuzzlesPerDay = totalPuzzles / daysBack;
  const avgGamesPerDay = totalGames / daysBack;
  const avgMinutesPerDay = totalMinutes / daysBack;

  // Format time display for average per day
  const formatAvgTime = (minutes: number): string => {
    const roundedMinutes = Math.round(minutes);
    if (roundedMinutes < 60) return `${roundedMinutes} min`;
    const hours = Math.round(minutes / 60);
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  };

  // Determine display: per day or per week for time
  const timeDisplay = avgMinutesPerDay >= (60 / 24) // roughly 2.5 minutes
    ? `${formatAvgTime(avgMinutesPerDay)} per day`
    : `${formatAvgTime(avgMinutesPerDay * 7)} per week`;

  // Determine display: per day or per week for puzzles
  const puzzlesDisplay = avgPuzzlesPerDay >= 1
    ? `${Math.round(avgPuzzlesPerDay)} puzzle${Math.round(avgPuzzlesPerDay) !== 1 ? 's' : ''} per day`
    : `${Math.round(avgPuzzlesPerDay * 7)} puzzle${Math.round(avgPuzzlesPerDay * 7) !== 1 ? 's' : ''} per week`;

  // Determine display: per day or per week for games
  const gamesDisplay = avgGamesPerDay >= 1
    ? `${Math.round(avgGamesPerDay)} game${Math.round(avgGamesPerDay) !== 1 ? 's' : ''} per day`
    : `${Math.round(avgGamesPerDay * 7)} game${Math.round(avgGamesPerDay * 7) !== 1 ? 's' : ''} per week`;

  const hasEnoughData = daysWithData >= 3;

  return (
    <section className="rounded-lg bg-primary p-4">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold">Your pace</h2>
          <p className="mt-1 text-sm text-gray-400">Average activity in this period</p>
        </div>
        <div className="flex rounded border border-gray-700 p-0.5 text-sm">
          {([['7d', 'Last 7 days'], ['30d', 'Last 30 days']] as const).map(([value, label]) => (
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

      {!hasEnoughData ? (
        <p className="text-sm text-gray-500">Not enough data yet — log activity on at least 3 days to see your pace.</p>
      ) : (
        <div className="space-y-3">
          {totalMinutes > 0 && (
            <div className="text-white">
              <span className="text-accent">{timeDisplay}</span>
            </div>
          )}
          {totalPuzzles > 0 && (
            <div className="text-white">
              <span className="text-accent">{puzzlesDisplay}</span>
            </div>
          )}
          {totalGames > 0 && (
            <div className="text-white">
              <span className="text-accent">{gamesDisplay}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
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

  const sessionsByDay = sessions.reduce<Record<string, typeof sessions>>((totals, session) => {
    const key = dateKey(new Date(session.createdAt));
    totals[key] = (totals[key] || []).concat(session);
    return totals;
  }, {});

  const minutesByDay = sessions.reduce<Record<string, number>>((totals, session) => {
    const key = dateKey(new Date(session.createdAt));
    totals[key] = (totals[key] || 0) + session.durationMinutes;
    return totals;
  }, {});

  // Calculate dominant category and total minutes for each day
  const getDominantCategory = (key: string): StudyCategory | null => {
    const daySessions = sessionsByDay[key] || [];
    if (daySessions.length === 0) return null;

    const categoryTotals = categories.reduce<Record<StudyCategory, number>>((totals, cat) => {
      totals[cat] = daySessions
        .filter(s => normalizeCategory(s.category) === cat)
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      return totals;
    }, {} as Record<StudyCategory, number>);

    let maxCategory = categories[0];
    let maxMinutes = categoryTotals[categories[0]];

    for (let i = 1; i < categories.length; i++) {
      if (categoryTotals[categories[i]] > maxMinutes) {
        maxCategory = categories[i];
        maxMinutes = categoryTotals[categories[i]];
      }
    }

    return maxMinutes > 0 ? maxCategory : null;
  };

  const visibleMinutes = days
    .filter((day): day is Date => day !== null)
    .map(day => minutesByDay[dateKey(day)] || 0);
  const maxMinutes = Math.max(1, ...visibleMinutes);

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
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-baseline">
        <div>
          <h2 className="text-lg font-semibold">Daily activity</h2>
          <p className="mt-1 text-sm text-gray-400">Minutes logged over the last 16 weeks</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
          {categories.map(cat => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: categoryColors[cat] }} />
              <span>{cat}</span>
            </div>
          ))}
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
                const key = day ? dateKey(day) : null;
                const minutes = day === null ? 0 : minutesByDay[key!] || 0;
                const dominantCategory = day && key ? getDominantCategory(key) : null;
                
                let bgColor = 'bg-gray-800';
                let title = day ? day.toLocaleDateString() : undefined;

                if (isFuture) {
                  bgColor = 'bg-gray-900/50';
                } else if (dominantCategory && minutes > 0) {
                  const opacity = 0.3 + (minutes / maxMinutes) * 0.7; // Opacity from 0.3 to 1.0
                  const hexColor = categoryColors[dominantCategory];
                  const bgStyle = {
                    backgroundColor: hexToRgba(hexColor, opacity),
                  };
                  title = `${title}: ${minutes} minutes (${dominantCategory})`;

                  return (
                    <span
                      key={day ? dateKey(day) : `future-${index}`}
                      title={title}
                      className="block h-4 w-4 justify-self-center rounded-sm border border-gray-700/70 sm:h-5 sm:w-5"
                      style={bgStyle}
                    />
                  );
                } else if (minutes === 0) {
                  title = `${title}: no activity`;
                }

                return (
                  <span
                    key={day ? dateKey(day) : `future-${index}`}
                    title={title}
                    className={`block h-4 w-4 justify-self-center rounded-sm border border-gray-700/70 sm:h-5 sm:w-5 ${bgColor}`}
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

function formatTimeDisplay(minutes: number): string {
  if (minutes === 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
}

function WeeklyTimeChart({ sessions }: StudyAnalyticsProps) {
  const today = startOfDay(new Date());
  const currentWeekStart = startOfWeek(today);

  // Generate last 12 weeks
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - (11 - i) * 7);
    return weekStart;
  });

  // Calculate total minutes per week
  const weeklyData = weeks.map(weekStart => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const totalMinutes = sessions.reduce((sum, session) => {
      const sessionDate = new Date(session.createdAt);
      if (sessionDate >= weekStart && sessionDate < weekEnd) {
        return sum + session.durationMinutes;
      }
      return sum;
    }, 0);

    const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    return {
      weekStart,
      label: weekLabel,
      minutes: totalMinutes,
    };
  });

  // Get this week's total
  const thisWeekTotal = sessions.reduce((sum, session) => {
    const sessionDate = new Date(session.createdAt);
    if (sessionDate >= currentWeekStart && sessionDate < new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return sum + session.durationMinutes;
    }
    return sum;
  }, 0);

  return (
    <section className="rounded-lg bg-primary p-4">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Weekly study time</h2>
          <p className="mt-1 text-sm text-gray-400">Last 12 weeks of activity</p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-accent">{formatTimeDisplay(thisWeekTotal)}</span>
          <span className="text-sm text-gray-400">this week</span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData} margin={{ top: 8, right: 16, bottom: 24, left: 40 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              style={{ color: '#9ca3af' }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              style={{ color: '#9ca3af' }}
              label={{ value: 'Minutes', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 12, color: '#9ca3af' } }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #374151', borderRadius: '0.5rem' }}
              labelStyle={{ color: '#d1d5db' }}
              formatter={(value: number) => [formatTimeDisplay(value), 'Study time']}
              cursor={{ fill: 'rgba(251, 191, 36, 0.1)' }}
            />
            <Bar dataKey="minutes" fill="#c8a96e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
               <Tooltip formatter={(value: number, name: string) => [`${value} min`, name]} />
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
      <Pace sessions={sessions} />
      <Heatmap sessions={sessions} />
      <WeeklyTimeChart sessions={sessions} />
      <CategoryPie sessions={sessions} />
    </div>
  );
}
