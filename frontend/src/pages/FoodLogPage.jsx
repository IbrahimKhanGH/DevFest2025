import { useState } from 'react';
import { useUser } from '../context/UserContext';
import Sidebar from '../components/dashboard/Sidebar';
import StatCard from '../components/dashboard/StatCard';
import MacroChart from '../components/dashboard/MacroChart';
import FoodAnalysis from '../components/foodLog/FoodAnalysis';
import { calculateProtein, calculateCarbs, calculateFats } from '../utils/macroCalculations';

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
        setConsumedNutrients(prev => ({
          protein: prev.protein + (data.nutritionalAnalysis.macronutrients?.protein || 0),
          carbs: prev.carbs + (data.nutritionalAnalysis.macronutrients?.carbs || 0),
          fats: prev.fats + (data.nutritionalAnalysis.macronutrients?.fats || 0)
        }));
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar userData={userData} />

      <div className="ml-72 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Stats Overview */}
          {userData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard 
                title="Current Weight"
                value={`${userData.user_weight} lbs`}
                trend="+2 lbs this month"
                icon="⚖️"
              />
              <StatCard 
                title="Height"
                value={userData.user_height}
                icon="📏"
              />
              <StatCard 
                title="Goal"
                value={userData.health_goal}
                icon="🎯"
              />
            </div>
          )}

          {/* Macro Goals Card */}
          {userData && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Daily Macro Goals</h3>
                <span className="text-sm text-purple-600 font-medium">View Details →</span>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <MacroChart 
                  icon="🥩"
                  label="Protein" 
                  value={consumedNutrients.protein} 
                  max={calculateProtein(userData.user_weight)}
                  color="protein"
                />
                <MacroChart 
                  icon="🍚"
                  label="Carbs" 
                  value={consumedNutrients.carbs}
                  max={calculateCarbs(userData.user_weight, userData.health_goal)}
                  color="carbs"
                />
                <MacroChart 
                  icon="🥑"
                  label="Fats" 
                  value={consumedNutrients.fats}
                  max={calculateFats(userData.user_weight)}
                  color="fats"
                />
              </div>
            </div>
          )}

          {/* Food Analysis Section */}
          <FoodAnalysis 
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            response={response}
            loading={loading}
            onAnalyze={handleAnalyzeImage}
          />
        </div>
      </div>
    </div>
  );
}

export default FoodLogPage; 