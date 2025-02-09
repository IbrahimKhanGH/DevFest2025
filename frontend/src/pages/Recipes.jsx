import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { Link } from 'react-router-dom';


const Recipes = () => {
  const { userData } = useUser();
  const [recipeData, setRecipeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userData) {
      setError("User data is not available.");
      return;
    }
  }, [userData]);

  const fetchRecipe = async () => {
    if (!userData.dietary_preference || !userData.health_goal) {
      setError("Please update your dietary preferences and health goal.");
      return;
    }

    setLoading(true);
    setError("");
    setRecipeData(null);
    setAudioSrc(null);

    try {
      const res = await fetch("http://localhost:3103/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch personalized recipe");
      }

      const data = await res.json();
      setRecipeData(data.recipe);
    } catch (error) {
      setError("Error fetching recipe. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateTTS = async () => {
    if (!recipeData || !recipeData.directions.length) {
      setError("No recipe directions available.");
      return;
    }

    setTtsLoading(true);
    setAudioSrc(null);

    try {
      const res = await fetch("http://localhost:3103/api/tts-directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directions: recipeData.directions }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate TTS.");
      }

      const data = await res.json();
      if (!data.success || !data.audio_base64) {
        throw new Error("Invalid TTS response.");
      }

      const binaryString = atob(data.audio_base64);
      const byteArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([byteArray], { type: "audio/mp3" });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioSrc(audioUrl);
    } catch (error) {
      console.error("Error generating TTS:", error);
      setError("Error generating audio. Please try again.");
    } finally {
      setTtsLoading(false);
    }
  };

  return (

    <div>
        {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🥗</span>
              <span className="text-xl font-bold text-green-400">NutriSnap AI</span>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link to="/" className="text-gray-300 hover:text-green-400 transition-colors">
                Home
              </Link>
              <Link to="/recipes" className="text-gray-300 hover:text-green-400 transition-colors">
                Recipes
              </Link>
            </nav>
          </div>
        </div>
      </header>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center py-12 px-4">
        <div className="max-w-4xl w-full text-center">
            <div className="mb-8 text-6xl">🥘</div>
            <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500 mb-6 animate-fade-in">
            Recipe Generator
            </h1>
            <p className="text-xl text-gray-300 mb-12 animate-fade-in-delay">
            AI-powered recipes tailored to your preferences and goals
            </p>

            <button
            onClick={fetchRecipe}
            disabled={loading}
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:scale-105 transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
            {loading ? (
                <>
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Recipe...
                </>
            ) : (
                <>
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Generate Recipe
                </>
            )}
            </button>

            {error && (
            <div className="mt-6 text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-4 animate-fade-in">
                {error}
            </div>
            )}

            {recipeData && (
            <div className="mt-12 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8 text-left animate-fade-in hover:bg-gray-800/80 transition-all">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
                {recipeData.recipe_name}
                </h2>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-semibold text-green-400 mb-4">Ingredients</h3>
                    <ul className="space-y-2 text-gray-300">
                    {recipeData.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-center">
                        <span className="text-emerald-500 mr-2">•</span>
                        {ingredient.name}: {ingredient.quantity} {ingredient.quantity_unit || ""}
                        </li>
                    ))}
                    </ul>
                </div>

                <div className="flex flex-col">
                    <h3 className="text-xl font-semibold text-green-400 mb-4">Audio Instructions</h3>
                    <div className="flex-1 flex flex-col items-start justify-center space-y-4">
                    <button
                        onClick={generateTTS}
                        disabled={ttsLoading}
                        className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:scale-105 transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {ttsLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Generating Audio...
                        </>
                        ) : (
                        <>
                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.414a5 5 0 001.414 1.414m0 0l.707.707M6.343 6.343a5 5 0 00-1.414 1.414m0 0L4.222 8.464" />
                            </svg>
                            Play Instructions
                        </>
                        )}
                    </button>

                    {audioSrc && (
                        <div className="w-full bg-gray-700/50 rounded-lg p-4 backdrop-blur-sm border border-gray-600">
                        <audio controls className="w-full">
                            <source src={audioSrc} type="audio/mp3" />
                            Your browser does not support the audio element.
                        </audio>
                        </div>
                    )}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <h3 className="text-xl font-semibold text-green-400 mb-4">Directions</h3>
                    <ol className="space-y-4 text-gray-300">
                    {recipeData.directions.map((step, index) => (
                        <li key={index} className="flex">
                        <span className="text-emerald-500 mr-3">{index + 1}.</span>
                        <span>{step}</span>
                        </li>
                    ))}
                    </ol>
                </div>
                </div>
            </div>
            )}
        </div>
        </div>
    </div>
  );
};

export default Recipes;