
import React from 'react';
import { ZoneConfig, ZoneType } from '../types';
import { Lightbulb, Target, Zap, MousePointerClick } from 'lucide-react';

interface ZoneGuideProps {
  activeZoneId: ZoneType | null;
  t: any;
  zones: ZoneConfig[];
}

const ZoneGuide: React.FC<ZoneGuideProps> = ({ activeZoneId, t, zones }) => {
  const activeZone = zones.find(z => z.id === activeZoneId);
  const info = activeZoneId ? t.zoneInfo[activeZoneId] : null;

  if (!activeZone || !info) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center min-h-[280px] w-full">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4 text-blue-500 animate-pulse">
           <MousePointerClick size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">{t.guide.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
          {t.guide.selectPrompt}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col justify-center min-h-[280px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="p-2.5 rounded-lg text-white shadow-lg shadow-black/20" style={{ backgroundColor: activeZone.color }}>
           <Lightbulb size={24} />
        </div>
        <div>
           <div className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t.guide.title}</div>
           <h3 className="text-2xl font-black text-gray-800 dark:text-white">{t.zones[activeZone.id]}</h3>
        </div>
      </div>

      {/* Grid Content - Horizontal Spread */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Scope */}
        <div className="bg-white/60 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:border-blue-500/30 transition-colors">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
             <Target size={14} />
             {t.guide.scope}
          </div>
          <div className="text-lg text-gray-900 dark:text-gray-100 font-bold leading-tight">
             {info.scope}
          </div>
        </div>

        {/* Examples */}
        <div className="bg-white/60 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:border-green-500/30 transition-colors">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
             <span className="text-sm leading-none">🖼️</span>
             {t.guide.examples}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
             {info.examples}
          </div>
        </div>

        {/* Usage */}
        <div className="bg-white/60 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:border-purple-500/30 transition-colors">
           <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
             <Zap size={14} />
             {t.guide.usage}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
             {info.usage}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ZoneGuide;
