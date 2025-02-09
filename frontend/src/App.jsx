import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";


// ✅ Form Page Component
function FormPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const navigate = useNavigate(); // For navigation

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "firstName") {
      setFirstName(value);
    } else if (name === "lastName") {
      setLastName(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("First Name:", firstName);
    console.log("Last Name:", lastName);
    
    // Navigate to Home page after form submission
    navigate("/home");
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <p className="text-xl font-bold">Call to get started</p>
      <div className="bg-blue-100 p-6 rounded-lg shadow-md">
        <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="firstName"
            value={firstName}
            placeholder="Enter your first name"
            className="border rounded-md p-2 w-64"
            onChange={handleChange}
          />

          <input
            type="text"
            name="lastName"
            value={lastName}
            placeholder="Enter your last name"
            className="border rounded-md p-2 w-64"
            onChange={handleChange}
          />

          <button type="submit" className="bg-blue-500 text-white rounded-md p-2">
            Call
          </button>
        </form>
      </div>
    </div>
  );
}

// ✅ Home Page Component
function HomePage() {
  const [imageUrl, setImageUrl] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (event) => {
    setImageUrl(event.target.value);
  };

  const handleUpload = async () => {
    if (!imageUrl.trim()) {
      alert("Please enter a valid image URL.");
      return;
    }

    setLoading(true); // ✅ Show loading state

    try {
      const res = await fetch("http://localhost:3103/api/analyze-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch response from server.");
      }

      const data = await res.json();
      const nutritionalData = data.nutritionalAnalysis; // ✅ Extract response properly
      console.log("🔹 AI Response:", nutritionalData);
      
      setResponse(nutritionalData);

    } catch (error) {
      console.error("Error processing image:", error);
      setResponse(null);
    } finally {
      setLoading(false); // ✅ Stop loading indicator
    }
  };
  

  return (
    <div className="h-screen bg-red-50 justify-center space-y-4">

      {/* URL Input */}
      <div className="flex w-full justify-center">
        <svg className="w-10 h-10 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.597 3.2A1 1 0 0 0 7.04 4.289a3.49 3.49 0 0 1 .057 1.795 3.448 3.448 0 0 1-.84 1.575.999.999 0 0 0-.077.094c-.596.817-3.96 5.6-.941 10.762l.03.049a7.73 7.73 0 0 0 2.917 2.602 7.617 7.617 0 0 0 3.772.829 8.06 8.06 0 0 0 3.986-.975 8.185 8.185 0 0 0 3.04-2.864c1.301-2.2 1.184-4.556.588-6.441-.583-1.848-1.68-3.414-2.607-4.102a1 1 0 0 0-1.594.757c-.067 1.431-.363 2.551-.794 3.431-.222-2.407-1.127-4.196-2.224-5.524-1.147-1.39-2.564-2.3-3.323-2.788a8.487 8.487 0 0 1-.432-.287Z"/>
        </svg>
      </div>

      <p className="w-full bg-blue-50 text-left font-bold text-3xl text-slate-500">Food Log</p>
      <div className="border rounded ">
      <img 
        className="w-full h-auto p-2 rounded-3xl object-cover col-span-1"
        src="https://iamafoodblog.b-cdn.net/wp-content/uploads/2019/02/full-english-7355w-2-1024x683.jpg"
        alt="Food"
      />

      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="col-span-1">
          <p className="text-left font-semibold text-lg text-slate-500">Macros:</p>
          <p className="text-left text-sm text-black">Protein: 30g</p>
          <p className="text-left text-sm text-black">Carbs: 30g</p>
          <p className="text-left text-sm text-black">Fats: 30g</p>
        </div>
        <div className="col-span-1">
          <p className="text-left font-semibold text-lg text-slate-500">Micros:</p>
          <p className="text-left text-sm text-black">Vitamins: 30g</p>
          <p className="text-left text-sm text-black">Minerals: 30g</p>
        </div>
      </div>

      <div className="w-full">
        <p className="text-left font-semibold text-lg text-slate-500">Insights:</p>
        <p className="text-left text-sm text-black" >This full English breakfast contains a variety of nutrient-dense foods, including eggs, bacon, sausages, grilled tomatoes, mushrooms, and toast. The presence of protein-rich eggs, bacon, and sausages, along with complex carbohydrates from whole wheat toast and fiber-rich vegetables, contributes to its high nutrient density.</p>
      </div>





      </div>
      <input
        type="text"
        value={imageUrl}
        onChange={handleInputChange}
        placeholder="Enter image URL"
        className="border p-2 rounded-md w-96"
      />

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        className={`bg-blue-500 text-white p-2 rounded-md ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Analyze Image"}
      </button>

      {/* AI Response Display */}
      {response && (
        <div className="border rounded-lg w-full max-w-lg bg-white shadow-lg p-4">
          {imageUrl && (
            <img 
              className="w-full h-48 object-cover rounded-3xl"
              src={imageUrl} 
              alt="Analyzed Food"
            />
          )}

          <div className="grid grid-cols-2 gap-4 p-4">
            <div>
              <p className="text-left font-semibold text-lg text-slate-500">Macros:</p>
              <p className="text-left text-sm text-black">Protein: {response.macronutrients?.protein}g</p>
              <p className="text-left text-sm text-black">Carbs: {response.macronutrients?.carbs}g</p>
              <p className="text-left text-sm text-black">Fats: {response.macronutrients?.fats}g</p>
            </div>
            <div>
              <p className="text-left font-semibold text-lg text-slate-500">Micros:</p>
              <p className="text-left text-sm text-black">Vitamins: {response.micronutrients?.vitamins.join(", ")}</p>
              <p className="text-left text-sm text-black">Minerals: {response.micronutrients?.minerals.join(", ")}</p>
            </div>
          </div>

          <div className="w-full p-4">
            <p className="text-left font-semibold text-lg text-slate-500">Insights:</p>
            <p className="text-left text-sm text-black">{response.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ Main App Component with Routing
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
