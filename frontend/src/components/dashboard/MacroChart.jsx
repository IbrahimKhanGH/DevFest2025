import { useEffect, useRef } from 'react';

function MacroChart({ label, value = 0, max, color, icon }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Fix for retina/high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set the canvas size accounting for device pixel ratio
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale the context to ensure correct drawing operations
    ctx.scale(dpr, dpr);
    
    // Set canvas CSS size
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    const percentage = Math.min((value / max) * 100, 100);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background arc
    ctx.beginPath();
    ctx.arc(100, 100, 80, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 20;
    ctx.stroke();
    
    // Only draw progress arc if there's any value
    if (value > 0) {
      const gradient = ctx.createLinearGradient(0, 0, 200, 0);
      if (color === 'protein') {
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(1, '#ec4899');
      } else if (color === 'carbs') {
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#06b6d4');
      } else {
        gradient.addColorStop(0, '#22c55e');
        gradient.addColorStop(1, '#10b981');
      }
      
      ctx.beginPath();
      ctx.arc(
        100, 
        100, 
        80, 
        Math.PI, 
        Math.PI + (percentage / 100) * Math.PI
      );
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 20;
      ctx.stroke();
    }
    
    // Improve text rendering
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    // Draw value text
    ctx.fillStyle = '#1f2937';
    ctx.font = '600 24px Inter, system-ui, sans-serif';
    ctx.fillText(`${value}g`, 100, 90);
    
    // Draw max text
    ctx.fillStyle = '#6b7280';
    ctx.font = '500 14px Inter, system-ui, sans-serif';
    ctx.fillText(`of ${max}g`, 100, 110);
    
  }, [value, max, color]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center space-x-2 mb-2">
        <span>{icon}</span>
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <canvas 
        ref={canvasRef} 
        width="200" 
        height="120" 
        className="w-[200px] h-[120px]"
      />
    </div>
  );
}

export default MacroChart; 