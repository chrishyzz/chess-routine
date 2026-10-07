import type { StudyCategory } from '../components/StudySessionForm';

export const categoryColors: Record<StudyCategory, string> = {
  'Games & analysis': '#FB923C',
  Tactics: '#4ADE80',
  Middlegame: '#93C5FD',
  Endgame: '#A78BFA',
  Openings: '#F87171',
};

export const categories = Object.keys(categoryColors) as StudyCategory[];
