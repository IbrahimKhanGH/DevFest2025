function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="animate-spin w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
      <p className="mt-4 text-sm text-gray-600">Analyzing your food...</p>
    </div>
  );
}

export default LoadingState; 