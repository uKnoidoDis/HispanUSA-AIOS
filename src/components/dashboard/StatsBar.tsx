interface StatsBarProps {
  total: number;
  docsReceivedCount: number;
  weekTotal?: number;
}

export default function StatsBar({ total, docsReceivedCount, weekTotal }: StatsBarProps) {
  const docsPercent = total > 0 ? Math.round((docsReceivedCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
        <p className="text-sm text-gray-500">Today&apos;s Appointments</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
        <p className="text-sm text-gray-500">Docs Received</p>
        <p className="text-2xl font-bold text-green-600 mt-1">{docsPercent}%</p>
        <p className="text-xs text-gray-400">{docsReceivedCount} of {total}</p>
      </div>
      {weekTotal !== undefined && (
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
          <p className="text-sm text-gray-500">This Week</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{weekTotal}</p>
        </div>
      )}
    </div>
  );
}
