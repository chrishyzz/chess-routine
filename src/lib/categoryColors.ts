import type { StudyCategory } from '../components/StudySessionForm';

export const categoryColors: Record<StudyCategory, string> = {
  'Games & analysis': '#F97316',
  Tactics: '#22C55E',
  Middlegame: '#60A5FA',
  Endgame: '#8B5CF6',
  Openings: '#EF4444',
};

export const categories = Object.keys(categoryColors) as StudyCategory[];
