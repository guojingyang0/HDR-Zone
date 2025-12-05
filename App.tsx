
import React, { useState, useMemo, useEffect } from 'react';
import { ZoneConfig, ZoneType } from './types';
import { generateCurveData } from './utils/hdrMath';
import { translations, Language } from './utils/i18n';
import HDRGraph from './components/HDRGraph';
import ZoneTopology3D from './components/ZoneTopology3D';
import ColorWheel from './components/ColorWheel';
import ZoneSettings from './components/ZoneSettings';
import GradientPreview from './components/GradientPreview';
import MathPanel from './components/MathPanel';
import ZoneGuide from './components/ZoneGuide'; 
import ImageGrader from './components/ImageGrader';
import { Info, Moon, Sun, Monitor, Layers, BookOpen, RotateCcw, Image as ImageIcon, ChevronDown, ChevronUp, Sparkles, Send } from 'lucide-react';

const DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";

const INITIAL_ZONES: ZoneConfig[] = [
  // Low Range Group (Low Pass)
  { 
    id: ZoneType.BLACK, 
    label: 'Black', 
    color: '#ef4444', 
    rangeEnd: -4.0, 
    minRange: -6.0,
    maxRange: -1.5,
    falloff: 0.1,
    direction: 'low', 
    exposure: 0, 
    saturation: 1, 
    isEnabled: true 
  },
  { 
    id: ZoneType.DARK, 
    label: 'Dark', 
    color: '#f97316', 
    rangeEnd: -1.5, 
    minRange: -4.0,
    maxRange: 1.0,
    falloff: 0.2,
    direction: 'low', 
    exposure: 0, 
    saturation: 1, 
    isEnabled: true 
  },
  { 
    id: ZoneType.SHADOW, 
    label: 'Shadow', 
    color: '#eab308', 
    rangeEnd: 1.0, 
    minRange: -1.5,
    maxRange: 6.0,
    falloff: 0.22,
    direction: 'low', 
    exposure: 0, 
    saturation: 1, 
    isEnabled: true 
  },
  // High Range Group (High Pass)
  { 
    id: ZoneType.LIGHT, 
    label: 'Light', 
    color: '#22c55e', 
    rangeEnd: -1.0, 
    minRange: -6.0,
    maxRange: 1.5,
    falloff: 0.22,
    direction: 'high', 
    exposure: 0, 
    saturation: 1, 
    isEnabled: true 
  },
  { 
    id: ZoneType.HIGHLIGHT, 
    label: 'Highlight', 
    color: '#3b82f6', 
    rangeEnd: 1.5, 
    minRange: -1.0,
    maxRange: 4.0,
    falloff: 0.2,
    direction: 'high', 
    exposure: 0, 
    saturation: 1, 
    isEnabled: true 
  },
  { 
    id: ZoneType.SPECULAR, 
    label: 'Specular', 
    color: '#a855f7', 
    rangeEnd: 4.0, 
    minRange: 1.5,
    maxRange: 6.0,
    falloff: 0.1,
    direction: 'high', 
    exposure: 0, 
    saturation: 1, 
    isEnabled: true 
  },
];

type Theme = 'light' | 'dark';
type ViewMode = '2d' | '3d' | 'image';
type TabMode = 'guide' | 'math';

function App() {
  const [lang, setLang] = useState<Language>('zh');
  const [theme, setTheme] = useState<Theme>('dark');
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [tabMode, setTabMode] = useState<TabMode>('guide');
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  
  const [zones, setZones] = useState<ZoneConfig[]>(INITIAL_ZONES);
  const [activeZoneId, setActiveZoneId] = useState<ZoneType | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Image State
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_IMAGE_URL);

  const t = translations[lang];

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleZoneActivation = (id: ZoneType | null) => {
    setActiveZoneId(id);
    if (id !== null) {
      setTabMode('guide');
    }
  };

  const handleZoneUpdate = (id: string, updates: Partial<ZoneConfig>) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z));
  };

  const handleZoneReset = (id: string) => {
    const initial = INITIAL_ZONES.find(z => z.id === id);
    if (initial) {
      handleZoneUpdate(id, {
        rangeEnd: initial.rangeEnd,
        falloff: initial.falloff,
        exposure: initial.exposure,
        saturation: initial.saturation,
        direction: initial.direction,
        isEnabled: true,
        isRangeUnlocked: false
      });
    }
  };

  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setImageSrc(evt.target.result as string);
          setViewMode('image');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeAndApply = async (text: string) => {
      setIsAiLoading(true);
      await new Promise(r => setTimeout(r, 800)); // Simulate think time

      // Deep copy initial state to ensure clean slate
      let newZones = JSON.parse(JSON.stringify(INITIAL_ZONES));
      const lower = text.toLowerCase().trim();
      
      // --- Explicit Reset Logic ---
      if (!lower || ['reset', 'default', 'flat', '重置', '默认', '平直'].some(k => lower.includes(k))) {
          setZones(newZones);
          setIsAiLoading(false);
          return;
      }

      let applied = false;

      // --- Contrast & Mood ---
      if (lower.includes('contrast') || lower.includes('drama') || lower.includes('对比')) {
          newZones = newZones.map((z: ZoneConfig) => {
              if (z.id === ZoneType.BLACK) return { ...z, exposure: -0.2 };
              if (z.id === ZoneType.SHADOW) return { ...z, exposure: -0.6 }; 
              if (z.id === ZoneType.LIGHT) return { ...z, exposure: 0.5 };
              if (z.id === ZoneType.HIGHLIGHT) return { ...z, exposure: 0.3 };
              return z;
          });
          applied = true;
      }

      // --- Cyberpunk / Neon ---
      // Needs crushed blacks, but punchy highlights and high saturation
      if (lower.includes('cyber') || lower.includes('neon') || lower.includes('朋克')) {
           newZones = newZones.map((z: ZoneConfig) => {
              if (z.id === ZoneType.BLACK) return { ...z, exposure: -1.0, saturation: 1.2 }; 
              if (z.id === ZoneType.DARK) return { ...z, exposure: -0.5, saturation: 1.5 };
              if (z.id === ZoneType.SHADOW) return { ...z, exposure: -0.3, saturation: 1.4 };
              if (z.id === ZoneType.HIGHLIGHT) return { ...z, exposure: 0.8, saturation: 1.3 }; 
              if (z.id === ZoneType.SPECULAR) return { ...z, exposure: 3.0, saturation: 0.5 }; 
              return z;
          });
          applied = true;
      } 
      
      // --- Vintage / Film ---
      // Faded blacks (Lift), soft highlights, slight desaturation
      else if (lower.includes('film') || lower.includes('vintage') || lower.includes('retro') || lower.includes('胶片')) {
           newZones = newZones.map((z: ZoneConfig) => {
              // Lift the Black point (Fade)
              if (z.id === ZoneType.BLACK) return { ...z, exposure: 0.8, rangeEnd: -5.0 }; 
              // Add some contrast in mids
              if (z.id === ZoneType.SHADOW) return { ...z, exposure: -0.2 };
              if (z.id === ZoneType.LIGHT) return { ...z, exposure: 0.2 };
              // Soften Highlights
              if (z.id === ZoneType.HIGHLIGHT) return { ...z, exposure: -0.5, falloff: 0.8 }; 
              // Roll off Speculars completely
              if (z.id === ZoneType.SPECULAR) return { ...z, exposure: -1.5 }; 
              // Global slight desaturation
              return { ...z, saturation: 0.85 };
          });
          applied = true;
      }

      // --- Night Scene ---
      // Darker overall, but preserve light sources
      else if (lower.includes('night') || lower.includes('dark') || lower.includes('evening') || lower.includes('夜')) {
           newZones = newZones.map((z: ZoneConfig) => {
              if (z.id === ZoneType.BLACK) return { ...z, exposure: -0.5 }; 
              if (z.id === ZoneType.DARK) return { ...z, exposure: -1.0, saturation: 0.8 }; 
              if (z.id === ZoneType.SHADOW) return { ...z, exposure: -0.5 };
              // Dim highlights but don't kill them
              if (z.id === ZoneType.HIGHLIGHT) return { ...z, exposure: -1.0, saturation: 0.5 }; 
              // Keep speculars (street lights) popping
              if (z.id === ZoneType.SPECULAR) return { ...z, exposure: 1.5, saturation: 1.0 }; 
              return z;
          });
          applied = true;
      }

      // --- High Key ---
      // Bright, airy, lifted shadows
      else if (lower.includes('high key') || lower.includes('high-key') || lower.includes('高调') || lower.includes('bright')) {
             newZones = newZones.map((z: ZoneConfig) => {
                if (z.id === ZoneType.BLACK) return { ...z, exposure: 0.8 }; 
                if (z.id === ZoneType.DARK) return { ...z, exposure: 0.6 };
                if (z.id === ZoneType.SHADOW) return { ...z, exposure: 0.4 }; 
                if (z.id === ZoneType.LIGHT) return { ...z, exposure: 0.6 }; 
                if (z.id === ZoneType.HIGHLIGHT) return { ...z, exposure: 0.2 }; // Don't blow out too much
                return z;
            });
            applied = true;
      }

      // --- Noir / B&W ---
      else if (lower.includes('noir') || lower.includes('b&w') || lower.includes('black and white') || lower.includes('黑白')) {
            newZones = newZones.map((z: ZoneConfig) => {
                return { 
                    ...z, 
                    saturation: 0, 
                    exposure: z.id === ZoneType.SHADOW ? -0.8 : (z.id === ZoneType.LIGHT ? 0.6 : z.exposure) 
                };
            });
            // Extra crunch
            newZones = newZones.map((z: ZoneConfig) => {
                 if (z.id === ZoneType.BLACK) return { ...z, exposure: -1.0 };
                 if (z.id === ZoneType.SPECULAR) return { ...z, exposure: 1.5 };
                 return z;
            });
            applied = true;
      }

      // --- Vibrant / Pop ---
      else if (lower.includes('pop') || lower.includes('vibrant') || lower.includes('鲜艳')) {
            newZones = newZones.map((z: ZoneConfig) => {
                if (z.id === ZoneType.SHADOW) return { ...z, saturation: 1.4, exposure: -0.1 };
                if (z.id === ZoneType.LIGHT) return { ...z, saturation: 1.3, exposure: 0.1 };
                return z;
            });
            applied = true;
      }

      // Fallback: S-Curve if typed something else but not recognized
      if (!applied && text.length > 0) {
           newZones = newZones.map((z: ZoneConfig) => {
              if (z.id === ZoneType.SHADOW) return { ...z, exposure: -0.4 };
              if (z.id === ZoneType.LIGHT) return { ...z, exposure: 0.4 };
              return z;
          });
      }

      setZones(newZones);
      setIsAiLoading(false);
  };

  const handleAiSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      analyzeAndApply(aiPrompt);
  };

  const triggerAiPreset = (text: string) => {
      setAiPrompt(text);
      analyzeAndApply(text);
  };

  const curveData = useMemo(() => generateCurveData(zones), [zones]);
  const activeZone = zones.find(z => z.id === activeZoneId);

  return (
    <div className={`min-h-screen transition-colors duration-500 ease-in-out
      bg-gray-100 text-gray-900 
      dark:bg-[#121212] dark:text-gray-300 
      p-4 md:p-8 font-sans selection:bg-blue-500/30`}>
      
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-300 dark:border-gray-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-gray-900 dark:text-gray-100">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/50"></div>
            {t.title}
          </h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1 ml-7 tracking-wider uppercase opacity-80">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
           {/* Theme/Lang Controls */}
           <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
              <button 
                onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
                className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-colors text-xs font-bold w-10 text-center"
              >
                {lang === 'en' ? '中' : 'EN'}
              </button>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
              <button 
                onClick={() => setTheme(th => th === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
           </div>
        </div>
      </header>

      {/* Top Educational/Context Section */}
      <section className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
             <button 
                onClick={() => { setTabMode('guide'); setIsInfoExpanded(true); }}
                className={`px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all
                ${tabMode === 'guide' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20 ring-offset-2 ring-offset-gray-100 dark:ring-offset-[#121212]' 
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm'}`}
             >
                <BookOpen size={16} /> {t.guide.title}
             </button>
             <button 
                onClick={() => { setTabMode('math'); setIsInfoExpanded(true); }}
                className={`px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all
                ${tabMode === 'math' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-500/20 ring-offset-2 ring-offset-gray-100 dark:ring-offset-[#121212]' 
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm'}`}
             >
                <RotateCcw size={16} /> {t.math.title}
             </button>
           </div>
           
           <button 
             onClick={() => setIsInfoExpanded(!isInfoExpanded)}
             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
           >
             {isInfoExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
           </button>
        </div>

        {isInfoExpanded && (
          <div className="glass-panel rounded-2xl p-1 overflow-hidden shadow-2xl relative z-0 transition-all duration-300">
             <div className="bg-gray-50/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl min-h-[240px] rounded-xl">
                {tabMode === 'guide' ? (
                  <ZoneGuide activeZoneId={activeZoneId} t={t} zones={zones} />
                ) : (
                  <MathPanel t={t} theme={theme} />
                )}
             </div>
          </div>
        )}
      </section>

      {/* AI Analysis Bar */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="glass-panel p-3 rounded-xl flex flex-col md:flex-row gap-4 items-center shadow-lg">
             {/* Label */}
             <div className="flex items-center gap-2 text-purple-500 font-bold whitespace-nowrap min-w-fit">
                 <Sparkles size={18} />
                 <span className="text-sm">{t.presets.title}</span>
             </div>
             
             {/* Input Area - Adjusted for alignment */}
             <div className="flex-1 w-full relative group">
                 <form onSubmit={handleAiSubmit} className="relative w-full flex items-center">
                    <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={t.presets.placeholder}
                        className="w-full h-10 bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-700 rounded-lg pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-gray-800 dark:text-white placeholder:text-gray-400"
                    />
                    <button 
                        type="submit" 
                        disabled={isAiLoading}
                        className="absolute right-1 w-8 h-8 bg-purple-600 hover:bg-purple-500 text-white rounded-md flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {isAiLoading ? <Sparkles size={16} className="animate-spin" /> : <Send size={14} />}
                    </button>
                 </form>
             </div>
             
             {/* Quick Chips */}
             <div className="flex items-center gap-2 overflow-x-auto max-w-full md:max-w-fit pb-1 md:pb-0 px-1 no-scrollbar mask-gradient">
                 <button onClick={() => triggerAiPreset(t.presets.chips.reset)} className="chip-btn bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700">{t.presets.chips.reset}</button>
                 <button onClick={() => triggerAiPreset(t.presets.chips.cyberpunk)} className="chip-btn border-purple-500/30 text-purple-500 hover:bg-purple-500/10">{t.presets.chips.cyberpunk}</button>
                 <button onClick={() => triggerAiPreset(t.presets.chips.film)} className="chip-btn border-orange-500/30 text-orange-500 hover:bg-orange-500/10">{t.presets.chips.film}</button>
                 <button onClick={() => triggerAiPreset(t.presets.chips.highkey)} className="chip-btn border-blue-500/30 text-blue-500 hover:bg-blue-500/10">{t.presets.chips.highkey}</button>
                 <button onClick={() => triggerAiPreset(t.presets.chips.bnw)} className="chip-btn border-gray-500/30 text-gray-500 hover:bg-gray-500/10">{t.presets.chips.bnw}</button>
             </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Visuals & Settings */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Visualization Card */}
          <div className="glass-panel rounded-2xl shadow-2xl p-1 relative overflow-hidden transition-all duration-500">
             
             {/* Toolbar for View Mode */}
             <div className="absolute top-4 left-4 z-10 flex gap-2">
                <div className="flex bg-gray-100 dark:bg-black/40 p-1 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-white/10">
                   <button
                     onClick={() => setViewMode('2d')}
                     className={`p-1.5 rounded-md transition-all ${viewMode === '2d' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
                     title={t.view2D}
                   >
                     <Monitor size={14} /> 
                   </button>
                   <button
                     onClick={() => setViewMode('3d')}
                     className={`p-1.5 rounded-md transition-all ${viewMode === '3d' ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}
                     title={t.view3D}
                   >
                     <Layers size={14} />
                   </button>
                   <button
                     onClick={() => setViewMode('image')}
                     className={`p-1.5 rounded-md transition-all ${viewMode === 'image' ? 'bg-white dark:bg-gray-700 shadow text-green-600 dark:text-green-400' : 'text-gray-400'}`}
                     title={t.viewImage}
                   >
                     <ImageIcon size={14} />
                   </button>
                </div>
             </div>

             {/* Graph/Image Area */}
             <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 min-h-[420px] flex flex-col justify-center relative">
                {viewMode === '2d' && (
                  <HDRGraph 
                    data={curveData} 
                    zones={zones} 
                    activeZoneId={activeZoneId}
                    width={800} 
                    height={400} 
                    theme={theme}
                    labels={{ xAxis: t.xAxis, yAxis: t.yAxis }}
                  />
                )}
                {viewMode === '3d' && (
                  <ZoneTopology3D
                    zones={zones}
                    activeZoneId={activeZoneId}
                    theme={theme}
                    width={800}
                    height={400}
                  />
                )}
                {viewMode === 'image' && (
                  <ImageGrader 
                    zones={zones}
                    imageSrc={imageSrc}
                    onImageImport={handleImageImport}
                    t={t}
                  />
                )}
             </div>
             
             {/* Footer Info */}
             <div className="px-4 py-3 bg-gray-50/50 dark:bg-black/20 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500">
                <span>{viewMode === 'image' ? t.viewImage : t.xAxis}</span>
                {viewMode === '2d' && <span>{t.activeCurve}</span>}
             </div>
          </div>

          {/* Gradient Strip (2D only) */}
          {viewMode === '2d' && (
             <GradientPreview 
               data={curveData} 
               labels={{
                 black: t.blackPoint,
                 white: t.whitePoint,
                 gray: t.grayRamp,
                 original: t.original,
                 graded: t.gradedOutput
               }}
               activeZone={activeZone}
             />
          )}

          {/* Zone Settings List */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5 text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
               <Layers size={16} />
               {t.zoneDefinitions}
            </div>
            
            <div className="space-y-1">
              {zones.map(zone => (
                <ZoneSettings 
                  key={zone.id} 
                  zone={zone} 
                  onChange={handleZoneUpdate}
                  onReset={() => handleZoneReset(zone.id)}
                  labels={{
                    name: t.zones[zone.id],
                    range: t.rangeLimit,
                    rangeUnlock: t.rangeUnlock,
                    rangeLock: t.rangeLock,
                    falloff: t.falloff,
                    low: t.low,
                    high: t.high,
                    toggleDirection: t.toggleDirection
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Wheels */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="glass-panel rounded-2xl p-6 sticky top-6 z-20">
             <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">{t.colorWheels}</h2>
                  <p className="text-xs text-gray-500 max-w-[250px]">{t.wheelDesc}</p>
                </div>
                <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
                   <Info size={20} />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                {zones.map(zone => (
                  <ColorWheel 
                    key={zone.id} 
                    zone={zone} 
                    onChange={handleZoneUpdate}
                    isActive={activeZoneId === zone.id}
                    onActivate={() => handleZoneActivation(zone.id === activeZoneId ? null : zone.id)}
                    labels={{
                      name: t.zones[zone.id],
                      reset: t.reset,
                      exp: t.exp,
                      sat: t.sat
                    }}
                  />
                ))}
             </div>
          </div>
        </div>

      </main>
      <style>{`
        .chip-btn {
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            border: 1px solid transparent;
            transition: all 0.2s;
            white-space: nowrap;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default App;
