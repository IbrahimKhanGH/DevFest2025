function MicronutrientList({ title, items }) {
  return (
    <div>
      <span className="text-sm font-medium text-gray-700">{title}:</span>
      <div className="mt-1 flex flex-wrap gap-2">
        {items?.map((item, index) => (
          <span 
            key={index}
            className="px-2 py-1 bg-white rounded-lg text-xs text-gray-600 border border-gray-200"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default MicronutrientList; 