import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { StudyCategory } from './StudySessionForm';

export interface FocusModeConfig {
  category: StudyCategory;
  durationType: 'time' | 'volume';
  durationValue: number;
  targetRatio: number;
  startedAt: string;
}

interface FocusModeProps {
  userId: string;
  sessions: { category: StudyCategory; durationMinutes: number; sessionDate: string }[];
  onFocusChange: (focusMode: FocusModeConfig | null) => void;
  onError: (error: string | null) => void;
}

const categories: StudyCategory[] = ['Games & analysis', 'Tactics', 'Endgame', 'Middlegame', 'Openings'];

export function FocusMode({ userId, sessions, onFocusChange, onError }: FocusModeProps) {
  const [focusMode, setFocusMode] = useState<FocusModeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [category, setCategory] = useState<StudyCategory>('Games & analysis');
  const [durationType, setDurationType] = useState<'time' | 'volume'>('time');
  const [durationValue, setDurationValue] = useState('7');
  const [targetRatio, setTargetRatio] = useState('70');
  const [now, setNow] = useState(Date.now());
  const expiryHandled = useRef(false);

  const clearFocusMode = useCallback(async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('focus_sprints')
      .delete()
      .eq('user_id', userId);
    setIsSaving(false);
    if (error) {
      onError(error.message);
      return;
    }
    setFocusMode(null);
    onFocusChange(null);
    expiryHandled.current = false;
    onError(null);
  }, [userId, onError, onFocusChange]);

  useEffect(() => {
    let active = true;
    async function fetchFocusMode() {
      const { data, error } = await supabase
        .from('focus_sprints')
        .select('category, duration_type, duration_value, target_ratio, started_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (!active) return;
      if (error) {
        onError(error.message);
      } else if (data) {
        const loadedFocusMode: FocusModeConfig = {
          category: data.category as StudyCategory,
          durationType: data.duration_type,
          durationValue: Number(data.duration_value),
          targetRatio: data.target_ratio,
          startedAt: data.started_at,
        };
        setFocusMode(loadedFocusMode);
        onFocusChange(loadedFocusMode);
      }
      setIsLoading(false);
    }

    void fetchFocusMode();
    return () => {
      active = false;
    };
  }, [userId, onError, onFocusChange]);

  useEffect(() => {
    if (!focusMode) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [focusMode]);

  const endTime = focusMode?.durationType === 'time'
    ? new Date(focusMode.startedAt).getTime() + focusMode.durationValue * 24 * 60 * 60 * 1000
    : null;

  useEffect(() => {
    if (!focusMode || endTime === null || now < endTime || expiryHandled.current) return;
    expiryHandled.current = true;
    void clearFocusMode();
  }, [focusMode, endTime, now, clearFocusMode]);

  const focusModeSessions = focusMode
    ? sessions.filter(session => session.sessionDate >= focusMode.startedAt.slice(0, 10))
    : [];
  const focusCategoryMinutes = focusMode
    ? focusModeSessions
      .filter(session => session.category === focusMode.category)
      .reduce((total, session) => total + session.durationMinutes, 0)
    : 0;
  const totalMinutes = focusModeSessions.reduce((total, session) => total + session.durationMinutes, 0);
  const volumeTargetMinutes = focusMode?.durationType === 'volume' ? focusMode.durationValue * 60 : 0;
  const daysRemaining = endTime === null ? 0 : Math.max(0, Math.ceil((endTime - now) / (24 * 60 * 60 * 1000)));
  const timeProgress = focusMode?.durationType === 'time' && endTime !== null
    ? Math.min(100, Math.max(0, (now - new Date(focusMode.startedAt).getTime()) / (endTime - new Date(focusMode.startedAt).getTime()) * 100))
    : 0;
  const volumeProgress = volumeTargetMinutes > 0 ? Math.min(100, totalMinutes / volumeTargetMinutes * 100) : 0;

  async function activateFocusMode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(durationValue);
    const ratio = Number(targetRatio);
    if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(ratio) || ratio < 1 || ratio > 99) {
      onError('Enter a valid duration and a focus category ratio between 1% and 99%.');
      return;
    }

    setIsSaving(true);
    onError(null);
    const startedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from('focus_sprints')
      .upsert({
        user_id: userId,
        category,
        duration_type: durationType,
        duration_value: value,
        target_ratio: ratio,
        started_at: startedAt,
      }, { onConflict: 'user_id' })
      .select('category, duration_type, duration_value, target_ratio, started_at')
      .single();
    setIsSaving(false);

    if (error) {
      onError(error.message);
      return;
    }

    const nextFocusMode: FocusModeConfig = {
      category: data.category as StudyCategory,
      durationType: data.duration_type,
      durationValue: Number(data.duration_value),
      targetRatio: data.target_ratio,
      startedAt: data.started_at,
    };
    expiryHandled.current = false;
    setFocusMode(nextFocusMode);
    onFocusChange(nextFocusMode);
    setShowSetup(false);
  }

  if (isLoading) {
    return <p className="mb-6 rounded-lg bg-primary px-5 py-4 text-sm text-gray-400">Loading Focus Mode...</p>;
  }

  if (focusMode) {
    const progress = focusMode.durationType === 'time' ? timeProgress : volumeProgress;
    return (
      <section className="mb-6 rounded-lg border border-amber-400/60 bg-gradient-to-r from-amber-500/15 to-primary p-4 shadow-[0_0_24px_rgba(251,191,36,0.12)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Focus Mode</p>
            <h2 className="mt-1 text-xl font-semibold">{focusMode.category}</h2>
            <p className="mt-1 text-sm text-gray-300">
              Targeting {focusMode.targetRatio}% of study time · {100 - focusMode.targetRatio}% for everything else
            </p>
          </div>
          <button
            type="button"
            onClick={() => void clearFocusMode()}
            disabled={isSaving}
            className="rounded border border-gray-600 px-3 py-2 text-sm text-gray-300 transition hover:border-red-400 hover:text-red-300 disabled:opacity-50"
          >
            {isSaving ? 'Ending...' : 'End Focus Mode'}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium text-white">
            {focusMode.durationType === 'time'
              ? `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`
              : `${(totalMinutes / 60).toFixed(1)} / ${focusMode.durationValue} hours logged`}
          </span>
          <span className="text-gray-400">
            {focusMode.durationType === 'time'
              ? `${Math.round(timeProgress)}% of Focus Mode elapsed`
              : `${Math.round(volumeProgress)}% complete · ${Math.round(focusCategoryMinutes)} min in focus category`}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-800">
          <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      {!showSetup ? (
        <button
          type="button"
          onClick={() => setShowSetup(true)}
          className="relative w-full overflow-hidden rounded-lg border border-[#c8a96e]/50 bg-[#c8a96e] px-4 py-4 text-center font-semibold text-[#161a1f] shadow-[0_8px_24px_rgba(200,169,110,0.12)] transition duration-300 hover:brightness-105 hover:shadow-[0_10px_28px_rgba(200,169,110,0.18)]"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(200, 169, 110, 0.92) 0%, rgba(200, 169, 110, 0.82) 100%)',
          }}
        >
          <span className="relative z-10">Focus Mode</span>
        </button>
      ) : (
        <form onSubmit={activateFocusMode} className="space-y-4 rounded-lg border border-amber-400/40 bg-primary p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Set up Focus Mode</h2>
              <p className="mt-1 text-sm text-gray-400">Create a focused target for your next training block.</p>
            </div>
            <button type="button" onClick={() => setShowSetup(false)} className="text-sm text-gray-400 hover:text-white">Cancel</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-gray-300">
              Focus category
              <select
                value={category}
                onChange={event => setCategory(event.target.value as StudyCategory)}
                className="mt-1 block w-full rounded border border-gray-700 bg-secondary px-3 py-2 text-white"
              >
                {categories.map(option => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-sm text-gray-300">
              Duration type
              <select
                value={durationType}
                onChange={event => {
                  const type = event.target.value as 'time' | 'volume';
                  setDurationType(type);
                  setDurationValue(type === 'time' ? '7' : '10');
                }}
                className="mt-1 block w-full rounded border border-gray-700 bg-secondary px-3 py-2 text-white"
              >
                <option value="time">Time-based</option>
                <option value="volume">Volume-based</option>
              </select>
            </label>
            {durationType === 'time' ? (
              <label className="text-sm text-gray-300">
                Focus Mode duration
                <select
                  value={durationValue}
                  onChange={event => setDurationValue(event.target.value)}
                  className="mt-1 block w-full rounded border border-gray-700 bg-secondary px-3 py-2 text-white"
                >
                  <option value="7">1 week</option>
                  <option value="14">2 weeks</option>
                  <option value="30">1 month</option>
                </select>
              </label>
            ) : (
              <label className="text-sm text-gray-300">
                Total target hours
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={durationValue}
                  onChange={event => setDurationValue(event.target.value)}
                  className="mt-1 block w-full rounded border border-gray-700 bg-secondary px-3 py-2 text-white"
                />
              </label>
            )}
            <label className="text-sm text-gray-300">
              Focus category target (%)
              <input
                type="number"
                min="1"
                max="99"
                step="1"
                required
                value={targetRatio}
                onChange={event => setTargetRatio(event.target.value)}
                className="mt-1 block w-full rounded border border-gray-700 bg-secondary px-3 py-2 text-white"
              />
              <span className="mt-1 block text-xs text-gray-500">{100 - (Number(targetRatio) || 0)}% for everything else</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded bg-accent px-4 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? 'Starting...' : 'Activate Focus Mode'}
          </button>
        </form>
      )}
    </section>
  );
}
