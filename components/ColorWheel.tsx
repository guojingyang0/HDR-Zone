
import React from 'react';
import { ZoneConfig } from '../types';
import { RefreshCcw } from 'lucide-react';

interface ColorWheelProps {
  zone: ZoneConfig;
  onChange: (id: string, updates: Partial<ZoneConfig>) => void;
  isActive: boolean;
  onActivate: () => void;
  labels: {
    name: string;
    reset: string;
    exp: string;
    sat: string;
  }
}

const ColorWheel: React.FC<ColorWheelProps> = ({ zone, onChange, isActive, onActivate, labels }) => {
  // Constants
  const SIZE = 120;
  const CENTER = SIZE / 2;
  const RADIUS = SIZE / 2 - 10;

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(zone.id, { exposure: 0, saturation: 1.0 });
  };

  return (
    <div 
      className={`relative flex flex-col items-center p-4 rounded-2xl transition-all duration-300 border
        ${isActive 
          ? 'glass-panel shadow-xl scale-105 z-10' 
          : 'border-transparent bg-white/5 dark:bg-white/5 hover:bg-white/10'
        }`}
      onClick={onActivate}
    >
      <div className="flex justify-between w-full mb-3 items-center z-10">
        <span className="text-[10px] font-black tracking-widest uppercase truncate max-w-[80px]" style={{ color: zone.color }}>
          {labels.name}
        </span>
        <button 
          onClick={handleReset} 
          title={labels.reset}
          className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        >
          <RefreshCcw size={10} />
        </button>
      </div>

      {/* The Wheel UI */}
      <div className="relative mb-6 group cursor-pointer knob-shadow rounded-full" style={{ width: SIZE, height: SIZE }}>
        
        {/* Metallic Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-100 to-gray-300 dark:from-gray-700 dark:to-black"></div>
        
        {/* Inner Dark Surface */}
        <div className="absolute inset-[4px] rounded-full bg-gray-100 dark:bg-[#0a0a0a] shadow-inner"></div>

        {/* Colorful Gradient Ring (Hue) */}
        <div 
          className="absolute inset-[10px] rounded-full opacity-40 mix-blend-overlay"
          style={{
            background: `conic-gradient(from 180deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)`
          }}
        ></div>

        {/* The Puck (Saturation/Hue Indicator) */}
        <div 
          className="absolute w-4 h-4 rounded-full shadow-lg border border-white/50 backdrop-blur-sm transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ease-out"
          style={{ 
            left: CENTER, 
            top: CENTER,
            background: zone.color,
            transform: `translate(-50%, -50%) scale(${0.8 + (zone.saturation - 1) * 0.4})`,
            boxShadow: `0 0 10px ${zone.color}`
          }} 
        ></div>
        
        {/* Exposure Ring Indicator (Arc) */}
        <svg className="absolute inset-0 pointer-events-none" width={SIZE} height={SIZE}>
           <defs>
             <filter id="glow-arc">
               <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
               <feMerge>
                   <feMergeNode in="coloredBlur"/>
                   <feMergeNode in="SourceGraphic"/>
               </feMerge>
             </filter>
           </defs>
           {/* Track */}
           <circle 
             cx={CENTER} cy={CENTER} r={RADIUS + 2} 
             fill="none" 
             stroke="currentColor" 
             className="text-gray-300 dark:text-gray-800"
             strokeWidth="3"
           />
           {/* Value Arc */}
           <circle 
             cx={CENTER} cy={CENTER} r={RADIUS + 2} 
             fill="none" 
             stroke={zone.exposure === 0 ? 'transparent' : (zone.exposure > 0 ? '#38bdf8' : '#94a3b8')} 
             strokeWidth="3"
             filter="url(#glow-arc)"
             strokeDasharray={`${Math.abs(zone.exposure) * 25}, 1000`}
             strokeDashoffset="0"
             transform={`rotate(-90 ${CENTER} ${CENTER})`}
             style={{ transition: 'stroke-dasharray 0.2s' }}
           />
        </svg>
      </div>

      {/* Controls */}
      <div className="w-full space-y-4 z-10">
        {/* Exposure */}
        <div className="group relative">
          <label className="absolute -top-3 left-0 text-[9px] font-bold text-gray-400 uppercase">{labels.exp}</label>
          <div className="absolute -top-3 right-0 text-[9px] font-mono text-gray-500">{zone.exposure.toFixed(2)}</div>
          <input 
            type="range" 
            min="-6" 
            max="6" 
            step="0.05"
            value={zone.exposure}
            onChange={(e) => onChange(zone.id, { exposure: parseFloat(e.target.value) })}
            className="w-full h-1 mt-2"
          />
        </div>

        {/* Saturation */}
        <div className="group relative">
           <label className="absolute -top-3 left-0 text-[9px] font-bold text-gray-400 uppercase">{labels.sat}</label>
           <div className="absolute -top-3 right-0 text-[9px] font-mono text-gray-500">{zone.saturation.toFixed(2)}</div>
          <input 
            type="range" 
            min="0" 
            max="2" 
            step="0.05"
            value={zone.saturation}
            onChange={(e) => onChange(zone.id, { saturation: parseFloat(e.target.value) })}
            className="w-full h-1 mt-2 accent-purple-500"
          />
        </div>
      </div>
    </div>
  );
};

export default ColorWheel;
