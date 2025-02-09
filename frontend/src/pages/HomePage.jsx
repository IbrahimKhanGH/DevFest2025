import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUser } from '../context/UserContext';

function HomePage() {
  const navigate = useNavigate();
  const { setUserData } = useUser();
  
  useEffect(() => {
    // Listen for webhook events
    const webhookStream = new EventSource('http://localhost:3103/api/webhook-stream');
    
    webhookStream.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 Received webhook data:", data);
        
        switch (data.type) {
          case 'call_started':
            // When call starts, show CallInProgress screen
            console.log("📞 Call started, navigating to progress screen");
            navigate('/call-in-progress');
            break;
          
          case 'image_data':  // Changed from 'user_data' to 'image_data'
            // When user data is received, set it and go to food log
            console.log("👤 Setting user data:", data.data);
            setUserData(data.data);
            navigate('/food-log');
            break;
          
          default:
            console.log("⚠️ Unknown event type:", data.type);
        }
      } catch (error) {
        console.error("❌ Error processing webhook SSE:", error);
      }
    };

    webhookStream.onerror = (error) => {
      console.error("❌ SSE Connection error:", error);
    };

    return () => {
      webhookStream.close();
    };
  }, [navigate, setUserData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-4xl text-center">
        <div className="mb-8">
          <img src="/tuah-icon.svg" alt="Tuah" className="h-24 w-24 mx-auto animate-float" />
        </div>
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500 mb-6 animate-fade-in">
          TalkTuahNutritionist
        </h1>
        <p className="text-xl text-gray-300 mb-12 animate-fade-in-delay">
          Snap. Analyze. Track Your Nutrition Journey.
        </p>
        
        <button 
          onClick={() => {
            // This would trigger your actual call initiation
            console.log("📞 Initiating call...");
          }}
          className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:scale-105 transition-all shadow-lg hover:shadow-emerald-500/20 animate-pulse"
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          </svg>
          Call to get started
        </button>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-delay-2">
          <FeatureCard 
            icon="📸"
            title="Instant Analysis"
            description="Take a photo of your meal and get instant nutritional insights"
          />
          <FeatureCard 
            icon="📊"
            title="Track Progress"
            description="Monitor your macro and micronutrient intake effortlessly"
          />
          <FeatureCard 
            icon="🎯"
            title="Smart Goals"
            description="AI-powered recommendations based on your health goals"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 hover:bg-gray-800/80 transition-all group">
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-semibold text-green-400 mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

export default HomePage; 