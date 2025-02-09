import { useState } from 'react';

function FoodLogPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (event) => {
    setImageUrl(event.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      alert("Please enter a valid image URL");
      return;
    }
    await handleAnalyzeImage(imageUrl);
  };

  const handleAnalyzeImage = async (imageUrl) => {
    try {
      setLoading(true);
      console.log("🔹 Sending image to Groq AI:", imageUrl);
      
      const response = await fetch('http://localhost:3103/api/nutritional-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log("🔹 Groq AI Analysis:", data.nutritionalAnalysis);
        setResponse(data.nutritionalAnalysis);
      } else {
        console.error("❌ Analysis failed:", data.error);
      }
    } catch (error) {
      console.error("❌ Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Your Food Analysis</h2>
        
        {/* Image URL Input Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Food Image URL
              </label>
              <input
                type="text"
                id="imageUrl"
                value={imageUrl}
                onChange={handleInputChange}
                placeholder="Enter image URL or try our sample image"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Analyze Image
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageUrl("https://images.immediate.co.uk/production/volatile/sites/30/2019/08/full-english-breakfast-d9acf82.jpg");
                }}
                className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Try Sample Image
              </button>
            </div>
          </form>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Analyzing your food...</p>
          </div>
        )}

        {response && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Macronutrients */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Macronutrients</h3>
              <div className="grid gap-4">
                <NutrientBar label="Protein" value={response.macronutrients?.protein} />
                <NutrientBar label="Carbs" value={response.macronutrients?.carbs} />
                <NutrientBar label="Fats" value={response.macronutrients?.fats} />
              </div>
            </div>

            {/* Micronutrients */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Micronutrients</h3>
              <div className="grid gap-2">
                <div>
                  <span className="font-medium">Vitamins:</span>
                  <span className="ml-2 text-gray-600">
                    {response.micronutrients?.vitamins.join(", ")}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Minerals:</span>
                  <span className="ml-2 text-gray-600">
                    {response.micronutrients?.minerals.join(", ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Analysis</h3>
              <p className="text-gray-600 leading-relaxed">{response.explanation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NutrientBar({ label, value }) {
  const percentage = Math.min((value / 100) * 100, 100);
  
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-600">{value}g</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default FoodLogPage; 