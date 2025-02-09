import NutrientBar from './NutrientBar';
import MicronutrientList from './MicronutrientList';
import LoadingState from '../shared/LoadingState';

function FoodAnalysis({ imageUrl, setImageUrl, response, loading, onAnalyze }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      alert("Please enter a valid image URL");
      return;
    }
    await onAnalyze(imageUrl);
  };

  const handleInputChange = (event) => {
    setImageUrl(event.target.value);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Food Analysis</h3>
        <button 
          onClick={() => {
            setImageUrl("https://images.immediate.co.uk/production/volatile/sites/30/2019/08/full-english-breakfast-d9acf82.jpg");
          }}
          className="text-sm text-purple-600 font-medium hover:text-purple-700"
        >
          Try Sample Image →
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={imageUrl}
            onChange={handleInputChange}
            placeholder="Paste your food image URL here..."
            className="w-full px-4 py-3 pr-24 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Analyze
          </button>
        </div>
      </form>

      {loading && <LoadingState />}

      {response && (
        <div className="space-y-6">
          <img 
            src={imageUrl}
            alt="Analyzed food"
            className="w-full h-48 object-cover rounded-xl"
          />
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Macronutrients</h4>
              <div className="space-y-3">
                <NutrientBar 
                  label="Protein" 
                  value={response.macronutrients?.protein}
                  color="from-purple-500 to-pink-500"
                />
                <NutrientBar 
                  label="Carbs" 
                  value={response.macronutrients?.carbs}
                  color="from-blue-500 to-cyan-500"
                />
                <NutrientBar 
                  label="Fats" 
                  value={response.macronutrients?.fats}
                  color="from-green-500 to-emerald-500"
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Micronutrients</h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <MicronutrientList 
                  title="Vitamins" 
                  items={response.micronutrients?.vitamins}
                />
                <MicronutrientList 
                  title="Minerals" 
                  items={response.micronutrients?.minerals}
                />
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-4">
            <h4 className="font-semibold text-purple-900 mb-2">Analysis</h4>
            <p className="text-purple-800 text-sm leading-relaxed">
              {response.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodAnalysis; 