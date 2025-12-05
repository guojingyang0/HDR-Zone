
import React, { useRef, useEffect, useState } from 'react';
import { ZoneConfig } from '../types';
import { processImageBuffer } from '../utils/hdrMath';
import { Upload, Download, Image as ImageIcon, Loader2 } from 'lucide-react';

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
      
      process(ctx);
    };
  }, [imageSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageDataRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    
    const runProcess = () => {
        setIsProcessing(true);
        setTimeout(() => {
             process(ctx);
             setIsProcessing(false);
        }, 10);
    };

    const timer = setTimeout(runProcess, 50);
    return () => clearTimeout(timer);
  }, [zones]);

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
      
      {/* Toolbar: Flex Wrap for responsiveness */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap justify-between gap-2 pointer-events-none">
         <div className="pointer-events-auto">
             <label className="cursor-pointer bg-white/90 dark:bg-black/80 backdrop-blur-md text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg shadow-lg hover:bg-white dark:hover:bg-black transition-all flex items-center gap-2 text-xs font-bold border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                <Upload size={14} />
                {t.importImage}
                <input type="file" accept="image/*" onChange={onImageImport} className="hidden" />
             </label>
         </div>

         <div className="pointer-events-auto">
             <button 
                onClick={handleExport}
                className="bg-blue-600/90 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-500 transition-all flex items-center gap-2 text-xs font-bold whitespace-nowrap"
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
      </div>
    </div>
  );
};

export default ImageGrader;
