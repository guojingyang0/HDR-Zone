
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ZoneConfig, MIN_STOP, MAX_STOP, ZoneType } from '../types';
import { getZoneWeight } from '../utils/hdrMath';

interface ZoneTopology3DProps {
  zones: ZoneConfig[];
  activeZoneId: ZoneType | null;
  theme: 'light' | 'dark';
  width?: number;
  height?: number;
}

const ZoneTopology3D: React.FC<ZoneTopology3DProps> = ({ zones, activeZoneId, theme, width = 800, height = 400 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Animation / Render parameters
    const margin = 40;
    const graphWidth = width - margin * 2;
    const graphHeight = height - margin * 2;

    // 3D Projection parameters
    // We want a "Ridge Plot" look:
    // X axis: -6 to +6 EV (Now -8 to +8)
    // Y axis: Weight 0 to 1 (Up)
    // Z axis: Zone Index (Depth)
    
    const zSpacing = 40; // Pixels between zones in depth
    const xSkew = 0.3;   // Isometric-ish skew for X
    const zSkewX = -0.8; // How much Z moves X
    const zSkewY = 0.4;  // How much Z moves Y (perspective down)
    
    const startX = margin + 100; // Shift right to fit skew
    const startY = height - margin - 50; 

    // 1. Clear & Ambient Background
    // Create a radial gradient to simulate a spotlight/ambient environment
    const bgGradient = ctx.createRadialGradient(
      width / 2, height / 2, height * 0.1, 
      width / 2, height / 2, width * 0.8
    );
    
    if (theme === 'dark') {
      bgGradient.addColorStop(0, '#222222'); // Center light
      bgGradient.addColorStop(1, '#050505'); // Dark corners
    } else {
      bgGradient.addColorStop(0, '#ffffff');
      bgGradient.addColorStop(1, '#e5e7eb');
    }
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Sort zones back to front for painter's algorithm
    const zonesToRender = [...zones]; 

    const project = (ev: number, weight: number, zIndex: number) => {
      // Normalize EV (-6 to 6) to 0..1
      const xNorm = (ev - MIN_STOP) / (MAX_STOP - MIN_STOP);
      
      // Base 2D coords
      const xBase = xNorm * (graphWidth * 0.6); // Scale down width to fit skew
      const yBase = weight * (graphHeight * 0.5);

      // Apply pseudo-3D transform
      const px = startX + xBase + (zIndex * zSpacing * zSkewX);
      const py = startY - yBase - (zIndex * zSpacing * zSkewY);
      
      return { x: px, y: py };
    };

    // Draw Floor Grid
    ctx.lineWidth = 1;
    const axisColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    
    zonesToRender.forEach((zone, i) => {
      const p1 = project(MIN_STOP, 0, i);
      const p2 = project(MAX_STOP, 0, i);
      
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = axisColor;
      ctx.stroke();
    });

    // Render Zones as Ridges
    zonesToRender.forEach((zone, i) => {
      if (!zone.isEnabled) return;
      
      const isActive = activeZoneId === zone.id;
      const baseOpacity = isActive ? 0.95 : 0.7;
      
      // Generate path points
      const points = [];
      const steps = 100;
      const stepSize = (MAX_STOP - MIN_STOP) / steps;
      
      ctx.beginPath();
      // Start at bottom left
      const startP = project(MIN_STOP, 0, i);
      ctx.moveTo(startP.x, startP.y);

      for(let step = 0; step <= steps; step++) {
         const ev = MIN_STOP + step * stepSize;
         const weight = getZoneWeight(ev, zone);
         const p = project(ev, weight, i);
         ctx.lineTo(p.x, p.y);
      }
      
      // End at bottom right
      const endP = project(MAX_STOP, 0, i);
      ctx.lineTo(endP.x, endP.y);
      ctx.closePath();

      // 2. Directional Lighting Simulation (Ridge Gradient)
      // Calculate colors based on Saturation
      const baseHsl = d3.hsl(zone.color);
      baseHsl.s *= zone.saturation; // Apply saturation setting
      
      const midColor = baseHsl.toString();
      const litColor = baseHsl.copy(); litColor.l = Math.min(1, litColor.l + 0.3); // Brighter
      const shadowColor = baseHsl.copy(); shadowColor.l = Math.max(0, shadowColor.l - 0.3); // Darker
      const floorShadow = theme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.1)';

      const gradientTopY = startP.y - 150; // Approx max height
      const gradientBotY = startP.y;
      
      const gradient = ctx.createLinearGradient(0, gradientTopY, 0, gradientBotY);
      
      gradient.addColorStop(0, litColor.toString());
      gradient.addColorStop(0.3, midColor);
      gradient.addColorStop(1, floorShadow); // Fade into the floor
      
      ctx.fillStyle = gradient;
      ctx.globalAlpha = baseOpacity;
      ctx.fill();

      // 3. Rim Light (Highlight Edge)
      // Draw a bright line on top to simulate edge catching light
      ctx.beginPath();
      ctx.moveTo(startP.x, startP.y);
      for(let step = 0; step <= steps; step++) {
         const ev = MIN_STOP + step * stepSize;
         const weight = getZoneWeight(ev, zone);
         const p = project(ev, weight, i);
         ctx.lineTo(p.x, p.y);
      }
      
      const rimColor = baseHsl.copy();
      rimColor.l = Math.min(1, rimColor.l + 0.4); // Very bright highlight
      
      ctx.strokeStyle = rimColor.toString();
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = isActive ? 2.5 : 1;
      ctx.stroke();
      
      // Label
      const labelP = project(MAX_STOP + 0.5, 0, i);
      
      ctx.fillStyle = theme === 'dark' ? '#888' : '#666';
      if (isActive) ctx.fillStyle = midColor;
      
      ctx.font = `${isActive ? 'bold' : 'normal'} 12px Inter, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(zone.label, labelP.x + 5, labelP.y + 4);
    });

    // Add Axis Labels
    ctx.fillStyle = theme === 'dark' ? '#444' : '#bbb';
    ctx.textAlign = 'center';
    
    // X Axis Labels (bottom most)
    // Manually iterate step of 2 to ensure we hit -8 and 8 and no decimals
    const stepSize = 2;
    for(let ev = MIN_STOP; ev <= MAX_STOP; ev += stepSize) {
       const p = project(ev, 0, -1); // Project slightly in front
       ctx.fillText(`${ev} EV`, p.x, p.y + 20);
    }

  }, [zones, activeZoneId, theme, width, height]);

  return (
    <canvas ref={canvasRef} className="w-full h-full" />
  );
};

export default ZoneTopology3D;
