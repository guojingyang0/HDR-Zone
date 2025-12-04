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
      <div className="glass-panel rounded-2xl p-6 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center h-[280px]">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4 text-blue-500">
           <MousePointerClick size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">{t.guide.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
          {t.guide.selectPrompt}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border-l-4 transition-all duration-300" style={{ borderLeftColor: activeZone.color }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg text-white shadow-lg" style={{ backgroundColor: activeZone.color }}>
           <Lightbulb size={20} />
        </div>
        <div>
           <div className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t.guide.title}</div>
           <h3 className="text-xl font-black text-gray-800 dark:text-white">{t.zones[activeZone.id]}</h3>
        </div>
      </div>

      <div className="space-y-4">
        
        {/* Scope */}
        <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-gray-500 uppercase">
             <Target size={12} />
             {t.guide.scope}
          </div>
          <div className="text-sm text-gray-800 dark:text-gray-200 font-medium pl-5">
             {info.scope}
          </div>
        </div>

        {/* Examples */}
        <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-gray-500 uppercase">
             <span className="text-lg leading-none">🖼️</span>
             {t.guide.examples}
          </div>
          <div className="text-sm text-gray-800 dark:text-gray-200 pl-5">
             {info.examples}
          </div>
        </div>

        {/* Usage */}
        <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
           <div className="flex items-center gap-2 mb-1 text-xs font-bold text-gray-500 uppercase">
             <Zap size={12} />
             {t.guide.usage}
          </div>
          <div className="text-sm text-gray-800 dark:text-gray-200 pl-5 leading-relaxed">
             {info.usage}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ZoneGuide;