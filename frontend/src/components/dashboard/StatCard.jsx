function StatCard({ title, value, trend, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {trend && <span className="text-xs text-green-600 font-medium">{trend}</span>}
      </div>
      <p className="mt-3 text-sm text-gray-500">{title}</p>
      <p className="text-xl font-semibold text-gray-800">{value}</p>
    </div>
  );
}

export default StatCard; 