
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
  
  // Ref to hold the original image data to avoid re-reading from DOM
  const originalImageDataRef = useRef<ImageData | null>(null);

  // 1. Load the image into the canvas when imageSrc changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "Anonymous"; // Allow CORS for the default image
    img.src = imageSrc;
    
    img.onload = () => {
      // Fit image to max dimensions while maintaining aspect ratio
      const MAX_WIDTH = 1200; 
      const scale = Math.min(1, MAX_WIDTH / img.width);
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Cache the original data
      originalImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Trigger initial process
      process(ctx);
    };
  }, [imageSrc]);

  // 2. Process image when Zones change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageDataRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Use requestAnimationFrame to prevent UI blocking during slider drags
    // and provide visual feedback
    let animationFrameId: number;
    
    const runProcess = () => {
        setIsProcessing(true);
        // Small delay to allow React to render the "Processing" state if needed
        setTimeout(() => {
             process(ctx);
             setIsProcessing(false);
        }, 10);
    };

    // Debounce slightly for performance
    const timer = setTimeout(runProcess, 50);
    
    return () => clearTimeout(timer);
  }, [zones]);

  const process = (ctx: CanvasRenderingContext2D) => {
    if (!originalImageDataRef.current) return;
    
    // Deep clone the original data so we don't overwrite the source
    // ImageData.data is a Uint8ClampedArray. 
    const newBuffer = new Uint8ClampedArray(originalImageDataRef.current.data);
    const newImageData = new ImageData(newBuffer, originalImageDataRef.current.width, originalImageDataRef.current.height);
    
    // Run the math
    const processed = processImageBuffer(newImageData, zones);
    
    // Put back
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
      
      {/* Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between pointer-events-none">
         <div className="pointer-events-auto">
             <label className="cursor-pointer bg-white/90 dark:bg-black/80 backdrop-blur-md text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg shadow-lg hover:bg-white dark:hover:bg-black transition-all flex items-center gap-2 text-xs font-bold border border-gray-200 dark:border-gray-700">
                <Upload size={14} />
                {t.importImage}
                <input type="file" accept="image/*" onChange={onImageImport} className="hidden" />
             </label>
         </div>

         <div className="pointer-events-auto">
             <button 
                onClick={handleExport}
                className="bg-blue-600/90 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-500 transition-all flex items-center gap-2 text-xs font-bold"
             >
                <Download size={14} />
                {t.exportImage}
             </button>
         </div>
      </div>

      {/* Main Canvas Area */}
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
