import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Home Page</h1>
      <button 
        onClick={() => navigate('/about')} 
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Go to About
      </button>
    </div>
  );
}

export default Home;
