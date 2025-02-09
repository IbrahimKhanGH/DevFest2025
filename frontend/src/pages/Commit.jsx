import { useUser } from '../context/UserContext';

function Commit() {
  const { userData } = useUser();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-6">Commit to Your Health!</h1>
      {userData ? (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">User Information</h2>
          <ul className="list-disc list-inside">
            <li><strong>Name:</strong> {userData.user_name}</li>
            <li><strong>Age:</strong> {userData.user_age}</li>
            <li><strong>Weight:</strong> {userData.user_weight} lbs</li>
            <li><strong>Height:</strong> {userData.user_height}</li>
            <li><strong>Gender:</strong> {userData.user_gender}</li>
            <li><strong>Health Goal:</strong> {userData.health_goal}</li>
            <li><strong>Dietary Preference:</strong> {userData.dietary_preference}</li>
            <li><strong>Additional Notes:</strong> {userData.additional_notes}</li>
          </ul>
        </div>
      ) : (
        <p>No user data available.</p>
      )}
    </div>
  );
}

export default Commit; 