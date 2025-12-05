
export const MIN_STOP = -8;
export const MAX_STOP = 8;

// Interaction limits for sliders
export const SLIDER_MIN = -6;
export const SLIDER_MAX = 6;

export enum ZoneType {
  BLACK = 'Black',
  DARK = 'Dark',
  SHADOW = 'Shadow',
  LIGHT = 'Light',
  HIGHLIGHT = 'Highlight',
  SPECULAR = 'Specular',
}

export type ZoneDirection = 'low' | 'high';

export interface ZoneConfig {
  id: ZoneType;
  label: string;
  color: string;
  // Positioning in the range -4 to +4 (stops)
  rangeStart?: number; // For band-pass
  rangeEnd: number;    // The cutoff point
  minRange?: number;   // Minimum allowed value for range slider
  maxRange?: number;   // Maximum allowed value for range slider
  falloff: number;     // The feathering amount
  direction: ZoneDirection; // Control High pass vs Low pass
  
  // The Grading Values
  exposure: number;
  saturation: number;
  
  // Interaction state
  isEnabled: boolean;
  isRangeUnlocked?: boolean; // New: overrides minRange/maxRange to global limits
}

export interface CurvePoint {
  x: number; // Input Luminance (stops)
  y: number; // Output Luminance (stops)
  weights: Record<ZoneType, number>; // How much each zone influences this pixel
}

export interface GradingHistory {
  id: string;
  name: string;
  timestamp: number;
  zones: ZoneConfig[];
}
