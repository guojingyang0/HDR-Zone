
import { ZoneConfig, ZoneType, CurvePoint, MIN_STOP, MAX_STOP } from '../types';

// We map a stop range of -6 to +6 for visualization
export const STEPS = 200;

/**
 * Calculates a smooth Hermite interpolation (smoothstep-like)
 * This mimics the soft falloff of HDR tools.
 */
const smoothFalloff = (val: number, edge: number, falloff: number, direction: 'low' | 'high'): number => {
  // If falloff is 0, it's a hard clip
  const f = Math.max(0.01, falloff); 
  
  if (direction === 'low') {
    // Passes signals LOWER than edge. 
    // Full effect at (edge - falloff) and below.
    // Zero effect at edge.
    if (val >= edge) return 0;
    if (val <= edge - f) return 1;
    
    // Normalize val between (edge - f) and edge to 0..1
    const t = (val - (edge - f)) / f;
    // Reverse because we want 1 at low end
    return 1 - (t * t * (3 - 2 * t)); 
  } else {
    // Passes signals HIGHER than edge.
    // Zero effect at edge.
    // Full effect at (edge + falloff).
    if (val <= edge) return 0;
    if (val >= edge + f) return 1;

    const t = (val - edge) / f;
    return t * t * (3 - 2 * t);
  }
};

/**
 * Calculates the weight (0.0 to 1.0) of a specific zone for a given input luminance (stop).
 */
export const getZoneWeight = (stop: number, zone: ZoneConfig): number => {
  if (!zone.isEnabled) return 0;

  // Uses the specific direction configured for this zone
  return smoothFalloff(stop, zone.rangeEnd, zone.falloff, zone.direction);
};

export const generateCurveData = (zones: ZoneConfig[]): CurvePoint[] => {
  const data: CurvePoint[] = [];
  const stepSize = (MAX_STOP - MIN_STOP) / STEPS;

  for (let i = 0; i <= STEPS; i++) {
    const inputX = MIN_STOP + i * stepSize;
    let outputY = inputX;
    
    const weights: Record<string, number> = {};

    // Apply zones additively based on weight
    zones.forEach(zone => {
      const w = getZoneWeight(inputX, zone);
      weights[zone.id] = w;
      
      // Exposure adjustment: standard offset in log space
      outputY += zone.exposure * w;
    });

    data.push({
      x: inputX,
      y: outputY,
      weights: weights as Record<ZoneType, number>
    });
  }

  return data;
};

// --- Image Processing Helpers ---

// Approximate sRGB to Linear conversion
// Using simplified gamma 2.2 for performance in JS, though sRGB is more complex.
const srgbToLinear = (v: number): number => {
  return Math.pow(v / 255, 2.2);
};

// Approximate Linear to sRGB conversion
const linearToSrgb = (v: number): number => {
  return Math.max(0, Math.min(255, Math.pow(v, 1 / 2.2) * 255));
};

// Convert Linear value to EV (Stops) relative to Middle Gray (0.18)
const linearToEV = (y: number): number => {
  if (y <= 0.000001) return -10; // Floor
  return Math.log2(y / 0.18);
};

// Convert EV back to Linear
const evToLinear = (ev: number): number => {
  return 0.18 * Math.pow(2, ev);
};

/**
 * Processes an ImageData buffer with the HDR Zone logic.
 * This runs on the CPU, so performance depends on image size.
 */
export const processImageBuffer = (
  imgData: ImageData, 
  zones: ZoneConfig[]
): ImageData => {
  const data = imgData.data;
  const len = data.length;
  
  // Optimization: Pre-calculate active zones to avoid checking isEnabled every pixel
  const activeZones = zones.filter(z => z.isEnabled && (z.exposure !== 0 || z.saturation !== 1));
  
  if (activeZones.length === 0) return imgData;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Alpha data[i+3] is ignored/preserved

    // 1. Convert to Linear
    const rLin = srgbToLinear(r);
    const gLin = srgbToLinear(g);
    const bLin = srgbToLinear(b);

    // 2. Calculate Luminance (Rec. 709 coefficients)
    const yLin = 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
    
    // 3. Convert to Log (EV)
    const ev = linearToEV(yLin);

    // 4. Calculate Accumulators
    let totalExposureOffset = 0;
    let totalSaturationScale = 1;

    for (let z = 0; z < activeZones.length; z++) {
      const zone = activeZones[z];
      const weight = getZoneWeight(ev, zone);
      
      if (weight > 0) {
        if (zone.exposure !== 0) {
            totalExposureOffset += zone.exposure * weight;
        }
        if (zone.saturation !== 1) {
            // Lerp saturation: 1.0 (no change) -> zone.saturation based on weight
            // Simplified: Multiplicative accumulation? Or weighted average?
            // Resolve uses weighted mixing. Here we simulate a mix.
            const satEffect = (zone.saturation - 1) * weight;
            totalSaturationScale += satEffect;
        }
      }
    }

    // 5. Apply Exposure (in Linear Space)
    // Adding exposure in Log space = Multiplying in Linear space
    // newY = 0.18 * 2^(ev + offset) = (0.18 * 2^ev) * 2^offset = oldY * 2^offset
    const exposureMultiplier = Math.pow(2, totalExposureOffset);
    
    let rOut = rLin * exposureMultiplier;
    let gOut = gLin * exposureMultiplier;
    let bOut = bLin * exposureMultiplier;

    // 6. Apply Saturation
    // Simple algorithm: Lerp between Gray and Color
    // Gray value is the Luminance of the output (after exposure)
    // Actually, we should apply saturation relative to the *new* luminance.
    if (totalSaturationScale !== 1) {
        const yOut = 0.2126 * rOut + 0.7152 * gOut + 0.0722 * bOut;
        rOut = yOut + (rOut - yOut) * totalSaturationScale;
        gOut = yOut + (gOut - yOut) * totalSaturationScale;
        bOut = yOut + (bOut - yOut) * totalSaturationScale;
    }

    // 7. Convert back to sRGB
    data[i] = linearToSrgb(rOut);
    data[i + 1] = linearToSrgb(gOut);
    data[i + 2] = linearToSrgb(bOut);
  }

  return imgData;
};
