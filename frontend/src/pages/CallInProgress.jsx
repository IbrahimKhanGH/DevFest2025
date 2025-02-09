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

        if (data.type === 'image_data') {
          console.log("👤 Received user data:", data.data);
          if (
            data.data.health_goal &&
            data.data.user_age &&
            data.data.user_weight &&
            data.data.user_height &&
            data.data.user_name &&
            data.data.user_gender
          ) {
            const userData = {
              name: data.data.user_name,
              age: data.data.user_age,
              weight: data.data.user_weight,
              height: data.data.user_height,
              gender: data.data.user_gender,
              dietaryPreference: data.data.dietary_preference || 'Not specified',
              healthGoal: data.data.health_goal,
              additionalNotes: data.data.additional_notes || ''
            };
            setUserData(userData);
            navigate('/food-log');
          } else {
            console.warn("⚠️ Incomplete user data received:", data.data);
          }
        }
      } catch (error) {
        console.error("❌ Error processing webhook SSE:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("❌ SSE Connection error:", error);
      eventSource.close();
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