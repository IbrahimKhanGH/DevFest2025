import React, { useState, useRef, useEffect } from 'react';

const MinimalAudioPlayer = ({ audioSrc }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('ended', () => setIsPlaying(false));
      return () => audio.removeEventListener('ended', () => setIsPlaying(false));
    }
  }, []);

  return (
    <div className="flex items-center gap-4">
      <audio ref={audioRef} src={audioSrc} className="hidden" />
      
      {/* Backward 5s */}
      <button 
        onClick={() => skip(-5)}
        className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center text-white hover:bg-gray-700/70 transition-all"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          className="w-5 h-5"
        >
          <path d="M11 17l-5-5 5-5" />
          <path d="M18 17l-5-5 5-5" />
        </svg>
      </button>

      {/* Play/Pause */}
      <button 
        onClick={togglePlayPause}
        className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white hover:scale-105 transition-all shadow-lg hover:shadow-emerald-500/20"
      >
        {isPlaying ? (
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            className="w-6 h-6"
          >
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
        ) : (
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            className="w-6 h-6 ml-1"
          >
            <polygon points="5 3 19 12 5 21" />
          </svg>
        )}
      </button>

      {/* Forward 5s */}
      <button 
        onClick={() => skip(5)}
        className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center text-white hover:bg-gray-700/70 transition-all"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          className="w-5 h-5"
        >
          <path d="M13 17l5-5-5-5" />
          <path d="M6 17l5-5-5-5" />
        </svg>
      </button>
    </div>
  );
};

export default MinimalAudioPlayer;