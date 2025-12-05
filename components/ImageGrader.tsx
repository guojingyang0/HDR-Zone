
import React, { useRef, useEffect, useState } from 'react';
import { ZoneConfig } from '../types';
import { processImageBuffer } from '../utils/hdrMath';
import { Upload, Download, Image as ImageIcon, Loader2, SplitSquareHorizontal } from 'lucide-react';

interface ImageGraderProps {
  zones: ZoneConfig[];
  imageSrc: string;
  onImageImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  t: any;
}

const ImageGrader: React.FC<ImageGraderProps> = ({ zones, imageSrc, onImageImport, t }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  
  const originalImageDataRef = useRef<ImageData | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    
    img.onload = () => {
      const MAX_WIDTH = 1200; 
      const scale = Math.min(1, MAX_WIDTH / img.width);
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      originalImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      if (showOriginal) {
          ctx.putImageData(originalImageDataRef.current, 0, 0);
      } else {
          process(ctx);
      }
    };
  }, [imageSrc]);

  // Effect to handle reprocessing OR toggling original view
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageDataRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (showOriginal) {
        // Just draw original
        ctx.putImageData(originalImageDataRef.current, 0, 0);
        return;
    }

    // Debounced processing for slider drag
    const runProcess = () => {
        setIsProcessing(true);
        setTimeout(() => {
             process(ctx);
             setIsProcessing(false);
        }, 10);
    };

    const timer = setTimeout(runProcess, 50);
    return () => clearTimeout(timer);
  }, [zones, showOriginal]);

  const process = (ctx: CanvasRenderingContext2D) => {
    if (!originalImageDataRef.current) return;
    
    const newBuffer = new Uint8ClampedArray(originalImageDataRef.current.data);
    const newImageData = new ImageData(newBuffer, originalImageDataRef.current.width, originalImageDataRef.current.height);
    
    const processed = processImageBuffer(newImageData, zones);
    
    ctx.putImageData(processed, 0, 0);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'hdr-graded-export.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  return (
    <div className="flex flex-col h-full relative" ref={containerRef}>
      
      {/* Toolbar: Positioned absolutely but top-aligned within the container. 
          Since View Mode buttons are now moved out in App.tsx, we can safely use the top area. 
      */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap justify-between gap-2 pointer-events-none">
         <div className="pointer-events-auto flex items-center gap-2">
             <label className="cursor-pointer bg-white/90 dark:bg-black/80 backdrop-blur-md text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg shadow-lg hover:bg-white dark:hover:bg-black transition-all flex items-center gap-2 text-xs font-bold border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                <Upload size={14} />
                {t.importImage}
                <input type="file" accept="image/*" onChange={onImageImport} className="hidden" />
             </label>
             
             {imageSrc && (
                 <button 
                    onMouseDown={() => setShowOriginal(true)}
                    onMouseUp={() => setShowOriginal(false)}
                    onMouseLeave={() => setShowOriginal(false)}
                    onTouchStart={() => setShowOriginal(true)}
                    onTouchEnd={() => setShowOriginal(false)}
                    className={`px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md transition-all flex items-center gap-2 text-xs font-bold border whitespace-nowrap select-none
                    ${showOriginal 
                        ? 'bg-blue-600 text-white border-blue-500 scale-95 ring-2 ring-blue-400' 
                        : 'bg-white/90 dark:bg-black/80 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                    }`}
                 >
                    <SplitSquareHorizontal size={14} />
                    {showOriginal ? t.original : t.compare}
                 </button>
             )}
         </div>

         <div className="pointer-events-auto">
             <button 
                onClick={handleExport}
                className="bg-gray-800/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-black px-3 py-1.5 rounded-lg shadow-lg hover:bg-black dark:hover:bg-white transition-all flex items-center gap-2 text-xs font-bold whitespace-nowrap border border-transparent"
             >
                <Download size={14} />
                {t.exportImage}
             </button>
         </div>
      </div>

      <div className="flex-1 bg-gray-50 dark:bg-[#0a0a0a] rounded-xl overflow-hidden flex items-center justify-center relative min-h-[400px] border border-gray-200 dark:border-gray-800">
         <canvas 
            ref={canvasRef}
            className="max-w-full max-h-full object-contain shadow-2xl"
         />
         {!imageSrc && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon size={48} className="mb-2 opacity-50"/>
                <span className="text-sm font-medium">{t.dragDrop}</span>
             </div>
         )}
         {isProcessing && (
             <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur flex items-center gap-2 z-20">
                 <Loader2 size={12} className="animate-spin" />
                 {t.processing}
             </div>
         )}
         {showOriginal && (
             <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-blue-600/80 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur z-20 font-bold tracking-widest uppercase pointer-events-none">
                 {t.original}
             </div>
         )}
      </div>
    </div>
  );
};

export default ImageGrader;
