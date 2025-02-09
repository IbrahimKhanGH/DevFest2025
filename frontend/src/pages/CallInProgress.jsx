import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

function CallInProgress() {
  const navigate = useNavigate();
  const { setUserData } = useUser();

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3103/api/webhook-stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'user_data') {
          console.log("👤 Received user data:", data.data);
          // Map the data correctly
          const userData = {
            name: data.data.name,
            age: data.data.age,
            weight: data.data.weight || 0,
            height: data.data.height,
            gender: data.data.gender,
            dietaryPreference: data.data.dietaryPreference || 'Not specified',
            healthGoal: data.data.healthGoal,
            additionalNotes: data.data.additionalNotes || ''
          };
          setUserData(userData);
          // Navigate directly to FoodLogPage
          navigate('/food-log');
        }
      } catch (error) {
        console.error("❌ Error processing webhook SSE:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("❌ SSE Connection error:", error);
      // Implement reconnection logic
      setTimeout(() => {
        eventSource.close();
        new EventSource('http://localhost:3103/api/webhook-stream');
      }, 1000);
    };

    return () => {
      eventSource.close();
    };
  }, [navigate, setUserData]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <img src="/tuah-icon.svg" alt="Tuah" className="h-16 w-16 mx-auto animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Call in Progress</h1>
        <p className="text-xl text-gray-400">Please wait while we analyze your call...</p>
        <div className="mt-8">
          <svg className="animate-spin h-10 w-10 text-green-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default CallInProgress; 