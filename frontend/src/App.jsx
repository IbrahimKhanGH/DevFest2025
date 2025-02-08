import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';

// Form Component
function FormPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const navigate = useNavigate(); // For navigation

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'firstName') {
      setFirstName(value);
    } else if (name === 'lastName') {
      setLastName(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("First Name:", firstName);
    console.log("Last Name:", lastName);
    
    // Navigate to Home page after form submission
    navigate('/home');
  };

  return (
    <div className='h-screen flex flex-col items-center justify-center'>
      <p className='text-xl font-bold'>Call to get started</p>
      <div className='bg-blue-100 p-6 rounded-lg shadow-md'>
        <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="firstName"
            value={firstName}
            placeholder="Enter your first name"
            className='border rounded-md p-2 w-64'
            onChange={handleChange}  
          />

          <input
            type="text"
            name="lastName"
            value={lastName}
            placeholder="Enter your last name"
            className='border rounded-md p-2 w-64'
            onChange={handleChange}  
          />

          <button type="submit" className='bg-blue-500 text-white rounded-md p-2'>
            Call
          </button>
        </form>
      </div>
    </div>
  );
}

// Home Page Component
function HomePage() {
  return (
    <div className="h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold">Hi, this is the Home Page</h1>
    </div>
  );
}

// Main App Component with Routing
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FormPage />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
