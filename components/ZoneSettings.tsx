
import React from 'react';
import { ZoneConfig, ZoneType, SLIDER_MIN, SLIDER_MAX } from '../types';
import { Eye, EyeOff, RotateCcw, ArrowRightFromLine, ArrowLeftFromLine, Lock, Unlock } from 'lucide-react';

interface ZoneSettingsProps {
  zone: ZoneConfig;
  onChange: (id: string, updates: Partial<ZoneConfig>) => void;
  onReset: () => void;
  labels: {
    name: string;
    range: string;
    rangeUnlock: string;
    rangeLock: string;
    falloff: string;
    low: string;
    high: string;
    toggleDirection?: string;
  }
}

const ZoneSettings: React.FC<ZoneSettingsProps> = ({ zone, onChange, onReset, labels }) => {
  const isLowPass = zone.direction === 'low';
  
  // Use specific constraints if defined, unless unlocked
  const isUnlocked = zone.isRangeUnlocked || false;
  
  // Dynamic limits based on lock state, constrained to Slider limits (-6 to +6)
  const rangeMin = isUnlocked ? SLIDER_MIN : (zone.minRange !== undefined ? zone.minRange : SLIDER_MIN);
  const rangeMax = isUnlocked ? SLIDER_MAX : (zone.maxRange !== undefined ? zone.maxRange : SLIDER_MAX);

  // Calculate Gradient percentages for the visual slider track
  // This visualizes: Solid Coverage -> Falloff Area -> Transparent
  const calculateGradient = () => {
    // We need to map the values (Stops) to percentages relative to the slider's own min/max range
    const toPercent = (val: number) => {
        // Clamp value to current slider visual range for calculation safety
        const clampedVal = Math.max(rangeMin, Math.min(rangeMax, val));
        const p = ((clampedVal - rangeMin) / (rangeMax - rangeMin)) * 100;
        return Math.max(0, Math.min(100, p));
    };

    const cutoffPct = toPercent(zone.rangeEnd);
    const falloffDist = zone.falloff;

    // Base background colors for the track
    const activeColor = zone.color;
    const inactiveColor = 'rgba(128,128,128,0.15)'; // faint gray

    if (isLowPass) {
        // Low Pass: Left side is solid, then fades out to right
        // Solid until (rangeEnd - falloff)
        const solidEndPct = toPercent(zone.rangeEnd - falloffDist);
        return `linear-gradient(to right, 
            ${activeColor} 0%, 
            ${activeColor} ${solidEndPct}%, 
            ${inactiveColor} ${cutoffPct}%, 
            ${inactiveColor} 100%)`;
    } else {
        // High Pass: Left side is empty, fades in, then solid to right
        // Fades in from rangeEnd to (rangeEnd + falloff)
        const solidStartPct = toPercent(zone.rangeEnd + falloffDist);
        return `linear-gradient(to right, 
            ${inactiveColor} 0%, 
            ${inactiveColor} ${cutoffPct}%, 
            ${activeColor} ${solidStartPct}%, 
            ${activeColor} 100%)`;
    }
  };

  const toggleDirection = () => {
      onChange(zone.id, { direction: isLowPass ? 'high' : 'low' });
  };
  
  const toggleLock = () => {
      onChange(zone.id, { isRangeUnlocked: !isUnlocked });
  };

  return (
    <div className="group flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10">
      
      {/* Toggle */}
      <button 
        onClick={() => onChange(zone.id, { isEnabled: !zone.isEnabled })}
        className={`p-1.5 rounded-md transition-colors ${
          zone.isEnabled 
            ? 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white' 
            : 'text-gray-300 dark:text-gray-700'
        }`}
      >
        {zone.isEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>

      {/* Label & Reset */}
      <div className="w-16 flex-shrink-0">
         <div className="flex items-center gap-1">
            <div className="text-xs font-bold truncate" style={{ color: zone.color }}>
                {labels.name}
            </div>
         </div>
         <div className="flex items-center justify-between">
             {/* Direction Toggle */}
             <button 
                onClick={toggleDirection}
                title={labels.toggleDirection || "Toggle Direction"}
                className="text-[9px] font-medium flex items-center gap-1 hover:text-white hover:bg-blue-500 rounded px-1 -ml-1 transition-colors"
                style={{ color: isLowPass ? undefined : zone.color }}
             >
                 {isLowPass ? labels.low : labels.high}
                 {isLowPass ? <ArrowLeftFromLine size={8} /> : <ArrowRightFromLine size={8} />}
             </button>

             {/* Reset Button */}
             <button 
                onClick={onReset}
                title="Reset Zone"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400"
             >
                 <RotateCcw size={8} />
             </button>
         </div>
      </div>

      {/* Sliders Container */}
      <div className="flex-1 grid grid-cols-2 gap-4">
          
          {/* Range Control with Visual Gradient */}
          <div className="flex flex-col justify-center">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">{labels.range}</span>
                  <button 
                    onClick={toggleLock} 
                    title={isUnlocked ? labels.rangeLock : labels.rangeUnlock}
                    className={`p-0.5 rounded transition-colors ${isUnlocked ? 'text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/30' : 'text-gray-300 hover:text-gray-500'}`}
                  >
                    {isUnlocked ? <Unlock size={8} /> : <Lock size={8} />}
                  </button>
              </div>
              
              {/* Editable Input for precise "Secondary Editing" */}
              <input 
                 type="number"
                 step="0.1"
                 min={rangeMin}
                 max={rangeMax}
                 value={zone.rangeEnd}
                 onChange={(e) => onChange(zone.id, { rangeEnd: parseFloat(e.target.value) })}
                 className={`text-[9px] font-mono bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-500 focus:outline-none w-10 text-right p-0 transition-colors
                    ${isUnlocked ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}
              />
            </div>
            
            <div className="relative w-full h-2 flex items-center">
                {/* Visual Track Background */}
                <div 
                    className="absolute inset-0 rounded-full h-1.5 my-auto pointer-events-none opacity-60"
                    style={{ background: calculateGradient() }}
                />
                
                {/* The Input */}
                <input 
                  type="range" 
                  min={rangeMin} 
                  max={rangeMax} 
                  step="0.1"
                  value={zone.rangeEnd}
                  onChange={(e) => onChange(zone.id, { rangeEnd: parseFloat(e.target.value) })}
                  className="w-full h-2 appearance-none bg-transparent cursor-pointer z-10 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.1)] [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3"
                />
            </div>
          </div>

          {/* Falloff Control */}
          <div className="flex flex-col justify-center">
             <div className="flex justify-between items-end mb-1">
              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">{labels.falloff}</span>
              <span className="text-[9px] font-mono text-gray-500">{zone.falloff.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01"
              value={zone.falloff}
              onChange={(e) => onChange(zone.id, { falloff: parseFloat(e.target.value) })}
              className="w-full h-1"
            />
          </div>
      </div>
    </div>
  );
};

export default ZoneSettings;
