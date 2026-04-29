interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  trend: string;
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <div className="bg-primary rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{trend}</span>
      </div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
