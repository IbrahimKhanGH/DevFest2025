import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useEffect } from 'react';

function HomePage() {
  const navigate = useNavigate();
  const { setUserData } = useUser();
  
  useEffect(() => {
    // Set up SSE connection to listen for webhook events
    const eventSource = new EventSource('http://localhost:3103/webhook-stream');
    
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-4xl text-center">
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-6 animate-fade-in">
          Talk to Your AI Nutritionist
        </h1>
        <p className="text-xl text-gray-600 mb-12 animate-fade-in-delay">
          Get personalized nutrition advice and meal plans tailored just for you
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
          className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:scale-105 transition-all shadow-lg hover:shadow-xl animate-bounce"
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Call to Get Started
        </button>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-delay-2">
          <FeatureCard 
            icon="🎯"
            title="Personalized Plans"
            description="Get nutrition advice tailored to your goals"
          />
          <FeatureCard 
            icon="🤖"
            title="AI-Powered"
            description="Advanced AI technology for accurate analysis"
          />
          <FeatureCard 
            icon="📱"
            title="Easy to Use"
            description="Just call and get started in minutes"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default HomePage; 