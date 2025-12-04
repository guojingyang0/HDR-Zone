import React from 'react';
import { CurvePoint, MIN_STOP, MAX_STOP, ZoneConfig } from '../types';

interface GradientPreviewProps {
  data: CurvePoint[];
  labels: {
    black: string;
    gray: string;
    white: string;
    original: string;
    graded: string;
  };
  activeZone?: ZoneConfig | null;
}

const GradientPreview: React.FC<GradientPreviewProps> = ({ data, labels, activeZone }) => {
  // Downsample data for CSS string performance
  const samples = data.filter((_, i) => i % 5 === 0);
  
  const gradientStops = samples.map((point) => {
    // Map input x (position in gradient) to %
    const percent = ((point.x - MIN_STOP) / (MAX_STOP - MIN_STOP)) * 100;
    
    // Map output y (brightness) to 0-255 color value
    const normY = Math.max(0, Math.min(1, (point.y - MIN_STOP) / (MAX_STOP - MIN_STOP)));
    const val = Math.floor(normY * 255);
    
    return `rgb(${val},${val},${val}) ${percent.toFixed(1)}%`;
  }).join(', ');

  const inputGradient = `linear-gradient(to right, #000 0%, #fff 100%)`;
  const outputGradient = `linear-gradient(to right, ${gradientStops})`;

  // Calculate overlay position for active zone
  let overlayStyle = {};
  if (activeZone) {
      // Range is from MIN_STOP to MAX_STOP (total 12 stops)
      const rangeTotal = MAX_STOP - MIN_STOP;
      
      let startStop = MIN_STOP;
      let endStop = MAX_STOP;

      // Visualization of "Pass" range based on direction
      if (activeZone.direction === 'low') {
          // Low Pass: From start to (rangeEnd + half_falloff for visualization soft edge)
          endStop = activeZone.rangeEnd + (activeZone.falloff / 2); 
          startStop = MIN_STOP;
      } else {
          // High Pass: From (rangeEnd - half_falloff) to end
          startStop = activeZone.rangeEnd - (activeZone.falloff / 2);
          endStop = MAX_STOP;
      }

      const leftPct = Math.max(0, ((startStop - MIN_STOP) / rangeTotal) * 100);
      const widthPct = Math.min(100, ((endStop - startStop) / rangeTotal) * 100);
      
      overlayStyle = {
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          opacity: 1
      };
  } else {
      overlayStyle = { opacity: 0 };
  }

  return (
    <div className="space-y-2 mt-4 select-none">
       <div className="flex justify-between text-xs text-gray-500 uppercase">
        <span>{labels.black}</span>
        <span>{labels.gray}</span>
        <span>{labels.white}</span>
      </div>
      
      {/* Input Ramp (Reference) */}
      <div className="relative h-4 w-full rounded-md overflow-hidden mb-1 ring-1 ring-gray-200 dark:ring-0 group">
        <div className="absolute inset-0" style={{ background: inputGradient }}></div>
        <div className="absolute inset-0 flex items-center justify-center text-[9px] text-black/50 font-bold mix-blend-difference">{labels.original}</div>
        
        {/* Active Zone Indicator Overlay */}
        <div 
            className="absolute top-0 bottom-0 border-x-2 border-white/80 bg-white/20 transition-all duration-300 ease-out flex items-center justify-center"
            style={overlayStyle}
        >
            {activeZone && (
                 <div className="bg-black/60 text-white text-[8px] px-1 rounded backdrop-blur-md">
                    {activeZone.label}
                 </div>
            )}
        </div>
      </div>

      {/* Output Ramp (Result) */}
      <div className="relative h-8 w-full rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="absolute inset-0" style={{ background: outputGradient }}></div>
        <div className="absolute inset-0 flex items-center justify-center text-[9px] text-white/80 font-bold mix-blend-difference shadow-sm">
          {labels.graded}
        </div>
      </div>
    </div>
  );
};

export default GradientPreview;