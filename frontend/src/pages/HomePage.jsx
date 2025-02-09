import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useEffect } from 'react';

function HomePage() {
  const navigate = useNavigate();
  const { setUserData } = useUser();
  
  useEffect(() => {
    // Set up SSE connection to listen for webhook events
    const eventSource = new EventSource('http://localhost:3103/webhook');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'call_analyzed' && data.customAnalysis) {
        setUserData(data.customAnalysis);
        navigate('/food-log');
      }
    };

    return () => eventSource.close();
  }, [navigate, setUserData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-4xl text-center">
        <div className="mb-8 text-6xl">🥗</div>
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500 mb-6 animate-fade-in">
          NutriSnap AI
        </h1>
        <p className="text-xl text-gray-300 mb-12 animate-fade-in-delay">
          Snap. Analyze. Track Your Nutrition Journey.
        </p>
        
        <button 
          onClick={() => {
            // Simulate a call for testing
            const mockCallData = {
              event: 'call_analyzed',
              customAnalysis: {
                user_name: "Ibrahim",
                user_age: 21,
                user_weight: 170,
                user_height: "5'10",
                user_gender: "male",
                health_goal: "Gaining muscle",
                dietary_preference: "none",
                additional_notes: "No additional remarks from the user."
              }
            };
            setUserData(mockCallData.customAnalysis);
            navigate('/food-log');
          }}
          className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:scale-105 transition-all shadow-lg hover:shadow-emerald-500/20 animate-pulse"
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          </svg>
          Get Started
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