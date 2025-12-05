
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ZoneConfig, ZoneType, GradingHistory } from './types';
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
import { Info, Moon, Sun, Monitor, Layers, BookOpen, RotateCcw, Image as ImageIcon, ChevronDown, ChevronUp, Sparkles, Send, History, Check, X } from 'lucide-react';

const DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";

// Professional Colorist System Prompt
const SYSTEM_PROMPT = `
You are a professional HDR colorist, combining image algorithm and color science knowledge.
Your task is to provide "Automatic Color Grading Parameter Suggestions" for an HDR Zone-based tool (DaVinci Resolve style).

Input:
1. An image (user provided).
2. User's target style (e.g., Cinematic, Cyberpunk, Natural).

Output:
A JSON object with specific adjustments.

Requirements:
- Maintain natural skin tones (do not skew Midtones/Light zones too much).
- Preserve details in Highlights and Shadows.
- Avoid banding or clipping.
- Map your "midtones" logic to the 0.0 EV range.

JSON Format:
{
  "baseParams": {
    "exposure": 0.00,  // Global offset (-1.0 to 1.0)
    "contrast": 0.00,  // S-Curve intensity (-1.0 to 1.0)
    "blacks": 0.00,    // Black point offset
    "saturation": 0.00 // Global saturation offset (-1.0 to 1.0)
  },
  "hdrZones": {
    "shadows":   {"lum": 0.0, "sat": 0.0}, // Affects Dark/Shadow zones
    "midtones":  {"lum": 0.0, "sat": 0.0}, // Affects Light zone
    "highlights":{"lum": 0.0, "sat": 0.0}, // Affects Highlight zone
    "specular":  {"lum": 0.0, "sat": 0.0}  // Affects Specular zone
  },
  "reason": "Short explanation of the grading strategy."
}
`;

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
  
  // AI & History State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [history, setHistory] = useState<GradingHistory[]>([
      { id: 'init', name: 'Default', timestamp: Date.now(), zones: JSON.parse(JSON.stringify(INITIAL_ZONES)) }
  ]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string>('init');
  
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

  // Helper to convert URL/Path to Base64 for Gemini
  const getBase64FromUrl = async (url: string): Promise<string> => {
    // If it's already data URL, return as is
    if (url.startsWith('data:')) return url;
    
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Fetch failed, possibly CORS. AI will run text-only mode.");
        return "";
    }
  };

  const saveToHistory = (name: string, newZones: ZoneConfig[]) => {
    const newEntry: GradingHistory = {
        id: `h_${Date.now()}`,
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        timestamp: Date.now(),
        zones: JSON.parse(JSON.stringify(newZones))
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 10)); // Keep last 10
    setCurrentHistoryId(newEntry.id);
  };

  const loadHistory = (entry: GradingHistory) => {
      setZones(JSON.parse(JSON.stringify(entry.zones)));
      setCurrentHistoryId(entry.id);
  };
  
  const deleteHistory = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setHistory(prev => prev.filter(h => h.id !== id));
      if (currentHistoryId === id && history.length > 1) {
          const next = history.find(h => h.id !== id);
          if (next) loadHistory(next);
      }
  };

  const applyAiResult = (data: any, promptText: string) => {
      const { baseParams, hdrZones } = data;
      
      let newZones = [...INITIAL_ZONES]; 
      
      const update = (id: ZoneType, updates: Partial<ZoneConfig>) => {
          newZones = newZones.map(z => z.id === id ? { ...z, ...updates } : z);
      };

      // 1. Global Base Params
      const globalExp = baseParams?.exposure || 0;
      const globalSat = (baseParams?.saturation || 0);
      const contrast = baseParams?.contrast || 0;
      const blacks = baseParams?.blacks || 0;

      // 2. Map AI Logic
      update(ZoneType.BLACK, { exposure: blacks + globalExp });

      if (hdrZones?.shadows) {
          const { lum, sat } = hdrZones.shadows;
          const contrastOffset = contrast * -0.3;
          update(ZoneType.DARK, { exposure: lum + globalExp + contrastOffset, saturation: 1 + sat + globalSat });
          update(ZoneType.SHADOW, { exposure: (lum * 0.5) + globalExp + (contrastOffset * 0.5), saturation: 1 + sat + globalSat });
      }

      if (hdrZones?.midtones) {
          const { lum, sat } = hdrZones.midtones;
          const contrastOffset = contrast * 0.1;
          update(ZoneType.LIGHT, { exposure: lum + globalExp + contrastOffset, saturation: 1 + sat + globalSat });
      }

      if (hdrZones?.highlights) {
          const { lum, sat } = hdrZones.highlights;
           const contrastOffset = contrast * 0.2;
          update(ZoneType.HIGHLIGHT, { exposure: lum + globalExp + contrastOffset, saturation: 1 + sat + globalSat });
      }

      if (hdrZones?.specular) {
          const { lum, sat } = hdrZones.specular;
          update(ZoneType.SPECULAR, { exposure: lum + globalExp, saturation: 1 + sat + globalSat });
      }

      setZones(newZones);
      saveToHistory(promptText, newZones);
      setViewMode('image');
  };

  const analyzeAndApply = async (text: string) => {
      setIsAiLoading(true);
      
      try {
          const lower = text.toLowerCase().trim();
          // Explicit Reset
          if (!lower || ['reset', 'default', 'flat', '重置', '默认'].some(k => lower.includes(k))) {
              setZones(INITIAL_ZONES);
              saveToHistory(t.presets.chips.reset, INITIAL_ZONES);
              setIsAiLoading(false);
              return;
          }

          // 1. Prepare Image
          let imagePart = null;
          const base64 = await getBase64FromUrl(imageSrc);
          if (base64) {
              const data = base64.split(',')[1]; 
              const mimeType = base64.split(';')[0].split(':')[1] || 'image/jpeg';
              imagePart = { inlineData: { mimeType, data } };
          }

          // 2. Call Gemini
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const contentsParts: any[] = [];
          if (imagePart) contentsParts.push(imagePart);
          contentsParts.push({ text: `Target Style: ${text}` });

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json"
            },
            contents: [{ parts: contentsParts }]
          });

          const resultText = response.text;
          if (resultText) {
              const analysis = JSON.parse(resultText);
              applyAiResult(analysis, text);
          }

      } catch (e) {
          console.error("AI Generation failed:", e);
          fallbackHeuristic(text);
      } finally {
          setIsAiLoading(false);
      }
  };

  const fallbackHeuristic = (text: string) => {
      let newZones = JSON.parse(JSON.stringify(INITIAL_ZONES));
      const lower = text.toLowerCase();
      
      if (lower.includes('cyber') || lower.includes('neon')) {
           newZones = newZones.map((z: ZoneConfig) => {
              if (z.id === ZoneType.BLACK) return { ...z, exposure: -1.0, saturation: 1.2 }; 
              if (z.id === ZoneType.HIGHLIGHT) return { ...z, exposure: 0.8, saturation: 1.3 }; 
              return z;
          });
      } else if (lower.includes('film') || lower.includes('vintage')) {
           newZones = newZones.map((z: ZoneConfig) => {
              if (z.id === ZoneType.BLACK) return { ...z, exposure: 0.8, rangeEnd: -5.0 }; 
              if (z.id === ZoneType.HIGHLIGHT) return { ...z, exposure: -0.5 }; 
              return { ...z, saturation: 0.85 };
          });
      }
      setZones(newZones);
      saveToHistory(text, newZones);
      setViewMode('image');
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

      {/* AI Analysis Bar & History */}
      <div className="max-w-7xl mx-auto mb-8 space-y-4">
        <div className="glass-panel p-3 rounded-xl flex flex-col md:flex-row gap-4 items-center shadow-lg">
             {/* Label */}
             <div className="flex items-center gap-2 text-purple-500 font-bold whitespace-nowrap min-w-fit">
                 <Sparkles size={18} />
                 <span className="text-sm">{t.presets.title}</span>
             </div>
             
             {/* Input Area */}
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
             </div>
        </div>
        
        {/* History / Versions List */}
        {history.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto px-1 no-scrollbar">
                <div className="flex items-center gap-1 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">
                    <History size={12} />
                    {t.history}
                </div>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 shrink-0"></div>
                {history.map((h) => (
                    <div 
                        key={h.id}
                        onClick={() => loadHistory(h)}
                        className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all shrink-0
                        ${currentHistoryId === h.id 
                            ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400' 
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                        <span className="font-medium max-w-[100px] truncate">{h.name}</span>
                        {currentHistoryId === h.id && <Check size={10} className="text-blue-500" />}
                        {h.id !== 'init' && (
                             <button 
                                onClick={(e) => deleteHistory(e, h.id)}
                                className="opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white rounded-full p-0.5 transition-all"
                             >
                                 <X size={10} />
                             </button>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Visuals & Settings */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Visualization Card */}
          <div className="glass-panel rounded-2xl shadow-2xl p-1 relative overflow-hidden transition-all duration-500 flex flex-col">
             
             {/* Card Header: Toolbar for View Mode (MOVED HERE TO FIX OVERLAP) */}
             <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('2d')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === '2d' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                    >
                        <Monitor size={14} /> {t.view2D}
                    </button>
                    <button
                        onClick={() => setViewMode('3d')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === '3d' ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                    >
                        <Layers size={14} /> {t.view3D}
                    </button>
                    <button
                        onClick={() => setViewMode('image')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'image' ? 'bg-white dark:bg-gray-700 shadow text-green-600 dark:text-green-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                    >
                        <ImageIcon size={14} /> {t.viewImage}
                    </button>
                </div>
             </div>

             {/* Graph/Image Area */}
             <div className="bg-white/50 dark:bg-black/20 rounded-b-xl p-4 min-h-[420px] flex flex-col justify-center relative">
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
             <div className="px-4 py-2 bg-gray-50/50 dark:bg-black/20 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-wider">
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
