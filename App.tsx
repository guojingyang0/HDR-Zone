
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
import { Info, Moon, Sun, Monitor, Layers, BookOpen, RotateCcw, Wand2, Image as ImageIcon } from 'lucide-react';

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
  const [tabMode, setTabMode] = useState<TabMode>('guide'); // Default to Guide for beginners
  const [zones, setZones] = useState<ZoneConfig[]>(INITIAL_ZONES);
  const [activeZoneId, setActiveZoneId] = useState<ZoneType | null>(null);
  
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
        direction: initial.direction, // Reset direction too
        isEnabled: true,
        isRangeUnlocked: false // Reset lock state
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
          // Switch to image view automatically when importing
          setViewMode('image');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const applyPreset = (type: string) => {
      let newZones = JSON.parse(JSON.stringify(INITIAL_ZONES));
      
      switch(type) {
          case 'contrast':
              // S-Curve: Lower shadows, raise lights
              newZones = newZones.map((z: ZoneConfig) => {
                  if (z.id === ZoneType.SHADOW) return { ...z, exposure: -0.5 }; // Subtler change
                  if (z.id === ZoneType.LIGHT) return { ...z, exposure: 0.5 };
                  return z;
              });
              break;
          case 'recoverSky':
              // Bring down Highlights and Specular
              newZones = newZones.map((z: ZoneConfig) => {
                  if (z.id === ZoneType.HIGHLIGHT) return { ...z, exposure: -1.0 };
                  if (z.id === ZoneType.SPECULAR) return { ...z, exposure: -1.5, falloff: 1.0 };
                  return z;
              });
              setActiveZoneId(ZoneType.HIGHLIGHT);
              break;
          case 'liftShadows':
              // Lift Dark and Shadow
              newZones = newZones.map((z: ZoneConfig) => {
                  if (z.id === ZoneType.DARK) return { ...z, exposure: 0.8 };
                  if (z.id === ZoneType.SHADOW) return { ...z, exposure: 0.4 };
                  return z;
              });
              setActiveZoneId(ZoneType.DARK);
              break;
           case 'softRoll':
              // Broad falloffs
              newZones = newZones.map((z: ZoneConfig) => ({ ...z, falloff: 0.8 }));
              break;
          default: // reset
              break;
      }
      setZones(newZones);
  };

  const curveData = useMemo(() => generateCurveData(zones), [zones]);
  const activeZone = zones.find(z => z.id === activeZoneId);

  return (
    <div className={`min-h-screen transition-colors duration-500 ease-in-out
      bg-gray-100 text-gray-900 
      dark:bg-[#121212] dark:text-gray-300 
      p-4 md:p-8 font-sans selection:bg-blue-500/30`}>
      
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-300 dark:border-gray-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-gray-900 dark:text-gray-100">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/50"></div>
            {t.title}
          </h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1 ml-7 tracking-wider uppercase opacity-80">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
           {/* View Toggle */}
           <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
             <button
               onClick={() => setViewMode('2d')}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === '2d' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
             >
               <Monitor size={14} /> {t.view2D}
             </button>
             <button
               onClick={() => setViewMode('3d')}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === '3d' ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}
             >
               <Layers size={14} /> {t.view3D}
             </button>
             <button
               onClick={() => setViewMode('image')}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'image' ? 'bg-white dark:bg-gray-700 shadow-sm text-green-600 dark:text-green-400' : 'text-gray-500'}`}
             >
               <ImageIcon size={14} /> {t.viewImage}
             </button>
           </div>

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

      {/* Preset Toolbar */}
      <div className="max-w-7xl mx-auto mb-8 overflow-x-auto">
        <div className="flex items-center gap-2 p-1 min-w-max">
           <span className="text-xs font-bold uppercase text-gray-400 mr-2 flex items-center gap-1">
             <Wand2 size={12} /> {t.presets.title}
           </span>
           <button onClick={() => applyPreset('reset')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">{t.presets.reset}</button>
           <button onClick={() => applyPreset('contrast')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-blue-500 text-blue-600 dark:text-blue-400 transition-all">{t.presets.contrast}</button>
           <button onClick={() => applyPreset('recoverSky')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-cyan-500 text-cyan-600 dark:text-cyan-400 transition-all">{t.presets.recoverSky}</button>
           <button onClick={() => applyPreset('liftShadows')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-orange-500 text-orange-600 dark:text-orange-400 transition-all">{t.presets.liftShadows}</button>
           <button onClick={() => applyPreset('softRoll')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-purple-500 text-purple-600 dark:text-purple-400 transition-all">{t.presets.softRoll}</button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Visuals & Educational Content */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Visualization Card */}
          <div className="glass-panel rounded-2xl shadow-2xl p-1 relative overflow-hidden transition-all duration-500">
             
             {/* Graph/Image Area */}
             <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 min-h-[420px] flex flex-col justify-center relative">
                
                {/* Overlay Label */}
                {viewMode !== 'image' && (
                  <div className="absolute top-4 right-4 z-10 pointer-events-none">
                    <div className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border backdrop-blur-sm
                      text-gray-500 border-gray-200 bg-white/40
                      dark:text-gray-400 dark:border-gray-700 dark:bg-black/40">
                        {viewMode === '2d' ? t.yAxis : 'Y: Weight / Z: Zone'}
                    </div>
                  </div>
                )}

                {viewMode === '2d' && (
                  <HDRGraph 
                    data={curveData} 
                    zones={zones} 
                    activeZoneId={activeZoneId}
                    width={800} 
                    height={400} 
                    theme={theme}
                    labels={{
                      xAxis: t.xAxis,
                      yAxis: t.yAxis
                    }}
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

          {/* Zone Definitions (Moved Up for better accessibility) */}
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

          {/* Educational Panels / Guide */}
          <div className="space-y-4">
             <div className="flex space-x-2">
                <button 
                    onClick={() => setTabMode('guide')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all
                    ${tabMode === 'guide' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                    <BookOpen size={14} /> {t.guide.title}
                </button>
                <button 
                    onClick={() => setTabMode('math')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all
                    ${tabMode === 'math' 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                    <RotateCcw size={14} /> {t.math.title}
                </button>
            </div>

            {tabMode === 'guide' ? (
                <ZoneGuide activeZoneId={activeZoneId} t={t} zones={zones} />
            ) : (
                <MathPanel t={t} theme={theme} />
            )}
          </div>

        </div>

        {/* Right Column: Wheels */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Controls Panel */}
          <div className="glass-panel rounded-2xl p-6 sticky top-6 z-20">
             <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">{t.colorWheels}</h2>
                  <p className="text-xs text-gray-500 max-w-[250px]">{t.wheelDesc}</p>
                </div>
                <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-2 rounded-lg animate-pulse">
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
                    onActivate={() => setActiveZoneId(zone.id === activeZoneId ? null : zone.id)}
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
    </div>
  );
}

export default App;
