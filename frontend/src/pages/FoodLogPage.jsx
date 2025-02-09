import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import StatCard from '../components/dashboard/StatCard';
import { Link } from 'react-router-dom';
import { calculateDailyCalories, calculateMacroTargets } from '../utils/nutritionCalculations';

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
            // Add timestamp check to prevent duplicate processing
            const lastProcessedTime = sessionStorage.getItem('lastProcessedImageTime');
            const currentTime = new Date(data.timestamp).getTime();
            
            if (!lastProcessedTime || currentTime - parseInt(lastProcessedTime) > 2000) {
              console.log("🖼️ Processing new image with analysis");
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
              
              // Update last processed time
              sessionStorage.setItem('lastProcessedImageTime', currentTime.toString());
            } else {
              console.log("⏭️ Skipping duplicate image processing");
            }
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

  const calculateTotalCalories = (nutrients) => {
    return Math.round(
      (nutrients.protein * 4) + 
      (nutrients.carbs * 4) + 
      (nutrients.fats * 9)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header with Glassmorphism */}
      <header className="bg-gray-800/30 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img src="/tuah-icon.svg" alt="Tuah" className="h-8 w-8" />
              <h1 className="ml-2 text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
                TalkTuahNutritionist
              </h1>
            </div>
            {userData && (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="text-gray-400">Welcome,</span>
                  <span className="ml-1 text-green-400 font-semibold">{userData.name}</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  {userData.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Card */}
        {userData && (
          <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-green-400">Your Health Profile</h2>
                <span className="px-4 py-1 rounded-full bg-green-500/10 text-green-400 text-sm">
                  Active Goal: {userData.healthGoal}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gray-700/50 rounded-xl p-4 backdrop-blur-sm border border-gray-600/50">
                  <div className="text-gray-400 text-sm mb-1">Age</div>
                  <div className="text-xl font-bold text-white">{userData.age}</div>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4 backdrop-blur-sm border border-gray-600/50">
                  <div className="text-gray-400 text-sm mb-1">Height</div>
                  <div className="text-xl font-bold text-white">{userData.height}</div>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4 backdrop-blur-sm border border-gray-600/50">
                  <div className="text-gray-400 text-sm mb-1">Weight</div>
                  <div className="text-xl font-bold text-white">{userData.weight || 'N/A'}</div>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4 backdrop-blur-sm border border-gray-600/50">
                  <div className="text-gray-400 text-sm mb-1">Diet Type</div>
                  <div className="text-xl font-bold text-white">{userData.dietaryPreference || 'Standard'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nutrition Tracking Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Food Log Section - Now spans 2 columns */}
          <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-xl font-bold text-green-400 mb-4">Today's Food Log</h3>
            
            {/* Scan Food Button */}
            <div className="text-center p-4 bg-gray-700/30 rounded-xl mb-6">
              <button 
                onClick={() => {/* Add image capture logic */}}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
              >
                <span>📸</span>
                <span>Take Photo</span>
              </button>
            </div>

            {/* Recent Activity / Food Log */}
            {analysisHistory.length > 0 ? (
              <div className="space-y-4">
                {analysisHistory.map((item, index) => (
                  <div key={index} className="bg-gray-700/50 rounded-xl p-4 flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden">
                      <img src={item.imageUrl} alt="Food" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-white">Food Analysis</div>
                          <div className="text-sm text-gray-400">{item.timestamp}</div>
                        </div>
                        <div className="text-sm text-gray-400">
                          {calculateTotalCalories(item.analysis.macronutrients)} calories
                        </div>
                      </div>
                      <div className="mt-2 flex space-x-4 text-sm">
                        <span className="text-green-400">P: {item.analysis.macronutrients.protein}g</span>
                        <span className="text-blue-400">C: {item.analysis.macronutrients.carbs}g</span>
                        <span className="text-yellow-400">F: {item.analysis.macronutrients.fats}g</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                No meals logged yet today. Start by taking a photo of your food!
              </div>
            )}
          </div>

          {/* Macro Tracking Section - Now on the right */}
          <div className="lg:col-span-1 space-y-6">
            {/* Daily Calories Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-xl font-bold text-green-400 mb-4">Daily Target</h3>
              <div className="text-3xl font-bold text-white text-center mb-4">
                {calculateDailyCalories(userData.weight, userData.height, userData.age, userData.gender, userData.healthGoal).toLocaleString()} calories
              </div>
              
              {/* Calorie Progress Bar */}
              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Calories Consumed</span>
                  <span className="text-sm text-gray-500">
                    {calculateTotalCalories(consumedNutrients)} 
                    / 
                    {calculateDailyCalories(userData.weight, userData.height, userData.age, userData.gender, userData.healthGoal)}
                  </span>
                </div>
                <div className="w-full bg-gray-600/50 rounded-full h-2">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
                    style={{
                      width: `${Math.min(
                        ((calculateTotalCalories(consumedNutrients) / calculateDailyCalories(userData.weight, userData.height, userData.age, userData.gender, userData.healthGoal)) * 100),
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Macro Progress Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-xl font-bold text-green-400 mb-4">Macro Progress</h3>
              <div className="space-y-4">
                {Object.entries(calculateMacroTargets(
                  calculateDailyCalories(userData.weight, userData.height, userData.age, userData.gender, userData.healthGoal),
                  userData.healthGoal
                )).map(([macro, target]) => (
                  <div key={macro} className="bg-gray-700/50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 capitalize">{macro}</span>
                      <span className="text-sm text-gray-500">
                        {Math.round(Number(consumedNutrients[macro]) || 0)}g / {Math.round(target)}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-600/50 rounded-full h-2">
                      <div 
                        className={`h-full rounded-full ${
                          macro === 'protein' ? 'bg-green-500' :
                          macro === 'carbs' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                        style={{
                          width: `${Math.min(((Number(consumedNutrients[macro]) || 0) / target) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default FoodLogPage; 