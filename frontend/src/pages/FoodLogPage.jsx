import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import StatCard from '../components/dashboard/StatCard';
import MacroChart from '../components/dashboard/MacroChart';
import { calculateProtein, calculateCarbs, calculateFats } from '../utils/macroCalculations';
import { Link } from 'react-router-dom';

function FoodLogPage() {
  const { userData } = useUser();
  const [imageUrl, setImageUrl] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [consumedNutrients, setConsumedNutrients] = useState({
    protein: 0,
    carbs: 0,
    fats: 0
  });
  const [analysisHistory, setAnalysisHistory] = useState([]);
  
  // Listen for new images via SSE
  useEffect(() => {
    let eventSource;
    
    const connectSSE = () => {
      console.log("🔌 Attempting to connect to SSE...");
      eventSource = new EventSource('http://localhost:3103/api/image-stream');
      
      eventSource.onopen = () => {
        console.log("🎯 SSE Connection successfully established");
      };
      
      eventSource.onmessage = (event) => {
        console.log("📨 Raw SSE message received:", event.data);
        try {
          const data = JSON.parse(event.data);
          console.log("🎁 Parsed SSE data:", data);
          
          if (data.imageUrl && data.nutritionalAnalysis) {
            console.log("🖼️ Processing new image with analysis:", {
              url: data.imageUrl,
              analysis: data.nutritionalAnalysis
            });
            setImageUrl(data.imageUrl);
            setResponse(data.nutritionalAnalysis);
            
            // Add to history
            setAnalysisHistory(prev => [{
              imageUrl: data.imageUrl,
              analysis: data.nutritionalAnalysis,
              timestamp: new Date().toLocaleTimeString()
            }, ...prev]);
            
            console.log("💪 Updating nutrients...");
            setConsumedNutrients(prev => {
              const newNutrients = {
                protein: prev.protein + (data.nutritionalAnalysis.macronutrients?.protein || 0),
                carbs: prev.carbs + (data.nutritionalAnalysis.macronutrients?.carbs || 0),
                fats: prev.fats + (data.nutritionalAnalysis.macronutrients?.fats || 0)
              };
              console.log("📊 New nutrient values:", newNutrients);
              return newNutrients;
            });
          }
        } catch (error) {
          console.error("❌ Error processing SSE message:", error);
          console.error("🔍 Problematic data:", event.data);
        }
      };

      eventSource.onerror = (error) => {
        console.error("💥 SSE Connection error:", error);
        console.log("🔄 Attempting to reconnect...");
        eventSource.close();
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) {
        console.log("👋 Cleaning up SSE connection");
        eventSource.close();
      }
    };
  }, []);

  const handleAnalyzeImage = async (url) => {
    try {
      setLoading(true);
      console.log("🔹 Sending image for analysis:", url);
      
      const response = await fetch('http://localhost:3103/api/nutritional-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: url })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log("✅ Analysis received:", data.nutritionalAnalysis);
        setResponse(data.nutritionalAnalysis);
        // Add to history with timestamp
        setAnalysisHistory(prev => [{
          imageUrl: url,
          analysis: data.nutritionalAnalysis,
          timestamp: new Date().toLocaleTimeString()
        }, ...prev]);
        // Update consumed nutrients
        setConsumedNutrients(prev => ({
          protein: prev.protein + (data.nutritionalAnalysis.macronutrients?.protein || 0),
          carbs: prev.carbs + (data.nutritionalAnalysis.macronutrients?.carbs || 0),
          fats: prev.fats + (data.nutritionalAnalysis.macronutrients?.fats || 0)
        }));
      } else {
        console.error("❌ Analysis failed:", data.error);
      }
    } catch (error) {
      console.error("❌ Error during analysis:", error);
    } finally {
      setLoading(false);
      setImageUrl(""); // Clear input after analysis
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🥗</span>
              <span className="text-xl font-bold text-green-400">NutriSnap AI</span>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link to="/" className="text-gray-300 hover:text-green-400 transition-colors">
                Home
              </Link>
              <Link to="/recipes" className="text-gray-300 hover:text-green-400 transition-colors">
                Recipes
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {userData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard 
              title="Current Weight"
              value={`${userData.user_weight} lbs`}
              trend="+2 lbs this month"
              icon="⚖️"
              className="bg-gray-800 border-gray-700 text-gray-200"
            />
            <StatCard 
              title="Height"
              value={userData.user_height}
              icon="📏"
              className="bg-gray-800 border-gray-700 text-gray-200"
            />
            <StatCard 
              title="Goal"
              value={userData.health_goal}
              icon="🎯"
              className="bg-gray-800 border-gray-700 text-gray-200"
            />
          </div>
        )}

        {/* Macro Goals Card */}
        {userData && (
          <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-200">Today's Nutrition</h3>
              <span className="text-sm text-green-400 font-medium cursor-pointer hover:text-green-300">
                View Details →
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <MacroChart 
                icon="🥩"
                label="Protein" 
                value={consumedNutrients.protein} 
                max={calculateProtein(userData.user_weight)}
                color="from-red-500 to-red-600"
                textColor="text-red-400"
              />
              <MacroChart 
                icon="🍚"
                label="Carbs" 
                value={consumedNutrients.carbs}
                max={calculateCarbs(userData.user_weight, userData.health_goal)}
                color="from-blue-500 to-blue-600"
                textColor="text-blue-400"
              />
              <MacroChart 
                icon="🥑"
                label="Fats" 
                value={consumedNutrients.fats}
                max={calculateFats(userData.user_weight)}
                color="from-yellow-500 to-yellow-600"
                textColor="text-yellow-400"
              />
            </div>
          </div>
        )}

        {/* Food Analysis Section */}
        <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-200">Food Analysis</h3>
            <button 
              onClick={() => setImageUrl("https://example.com/sample-food.jpg")}
              className="text-sm text-green-400 font-medium hover:text-green-300"
            >
              Try Sample Image →
            </button>
          </div>

          {/* Analysis History */}
          <div className="space-y-6">
            {analysisHistory.map((item, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="text-sm text-gray-400 mb-4">
                  Analyzed at {item.timestamp}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Image Preview */}
                  <div className="bg-gray-700 rounded-xl p-4 flex items-center justify-center h-[400px]">
                    <img 
                      src={item.imageUrl} 
                      alt="Food" 
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>

                  {/* Nutritional Info */}
                  <div className="space-y-4">
                    <div className="bg-gray-700 rounded-xl p-4">
                      <h4 className="font-semibold text-green-400 mb-2">
                        {item.analysis.primaryIngredients}
                      </h4>
                      <p className="text-gray-300 text-sm mb-4">
                        {item.analysis.explanation}
                      </p>
                      
                      {/* Macronutrients */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-red-400 font-semibold">
                            Protein
                          </div>
                          <div className="text-gray-200">
                            {item.analysis.macronutrients?.protein || 0}g
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-400 font-semibold">
                            Carbs
                          </div>
                          <div className="text-gray-200">
                            {item.analysis.macronutrients?.carbs || 0}g
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-yellow-400 font-semibold">
                            Fats
                          </div>
                          <div className="text-gray-200">
                            {item.analysis.macronutrients?.fats || 0}g
                          </div>
                        </div>
                      </div>

                      {/* Calories */}
                      <div className="text-center mb-4">
                        <div className="text-purple-400 font-semibold">
                          Calories
                        </div>
                        <div className="text-gray-200 text-2xl font-bold">
                          {item.analysis.macronutrients?.calories || 0}
                        </div>
                      </div>
                    </div>

                    {/* Micronutrients */}
                    <div className="bg-gray-700 rounded-xl p-4">
                      <h4 className="font-semibold text-green-400 mb-2">Micronutrients</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-gray-400 text-sm mb-1">Vitamins</h5>
                          <ul className="text-gray-200 text-sm">
                            {item.analysis.micronutrients?.vitamins?.map((vitamin, i) => (
                              <li key={i}>{vitamin}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="text-gray-400 text-sm mb-1">Minerals</h5>
                          <ul className="text-gray-200 text-sm">
                            {item.analysis.micronutrients?.minerals?.map((mineral, i) => (
                              <li key={i}>{mineral}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-xl p-4">
                      <h4 className="font-semibold text-green-400 mb-2">Nutrient Density</h4>
                      <div className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                        {item.analysis.nutrientDensity}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default FoodLogPage; 