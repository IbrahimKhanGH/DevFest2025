function NutrientBar({ label, value, color }) {
  const percentage = Math.min((value / 100) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium text-gray-700">{value}g</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default NutrientBar; 