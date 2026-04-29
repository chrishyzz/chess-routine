import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface StatsData {
  date: string;
  duration: number;
  puzzles: number;
}

interface StatsChartProps {
  data: StatsData[];
}

export function StudyChart({ data }: StatsChartProps) {
  return (
    <div className="w-full h-96 mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend />
          <Line type="monotone" dataKey="duration" stroke="#3b82f6" name="Study Time (min)" />
          <Line type="monotone" dataKey="puzzles" stroke="#10b981" name="Puzzles Solved" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
