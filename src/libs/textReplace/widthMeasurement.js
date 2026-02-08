/**
 * Text width measurement utilities for accurate text extraction
 * Uses a three-tier approach: pdf.js width → canvas measurement → character estimation
 */

import { mapToAvailableFont } from './textExtractor.js';

// Lazy-initialized canvas context for measurements
let canvasContext = null;

// Cache: Map<"text|fontSize|fontName", width>
const widthCache = new Map();
const MAX_CACHE_SIZE = 1000; // Prevent memory bloat

/**
 * Measure text width using best available method
 * @param {string} text - Text to measure
 * @param {number} fontSize - Font size in pixels
 * @param {string} fontName - Font family name
 * @param {number|null} pdfJsWidth - Optional width from pdf.js (preferred)
 * @returns {number} Width in pixels
 */
export function measureTextWidth(text, fontSize, fontName, pdfJsWidth = null) {
  // Tier 1: Use pdf.js width if available (most accurate)
  if (pdfJsWidth !== null && pdfJsWidth > 0) {
    return pdfJsWidth;
  }

  // Check cache
  const cacheKey = `${text}|${fontSize}|${fontName}`;
  if (widthCache.has(cacheKey)) {
    return widthCache.get(cacheKey);
  }

  let width;

  // Tier 2: Canvas measurement (accurate, font-specific)
  try {
    width = measureWithCanvas(text, fontSize, fontName);
  } catch (e) {
    console.warn('Canvas measurement failed, falling back to estimation:', e);
    // Tier 3: Enhanced character-based estimation (fallback)
    width = estimateWithCharacters(text, fontSize, fontName);
  }

  // Cache result (with size limit)
  if (widthCache.size >= MAX_CACHE_SIZE) {
    // Simple FIFO eviction
    const firstKey = widthCache.keys().next().value;
    widthCache.delete(firstKey);
  }
  widthCache.set(cacheKey, width);

  return width;
}

/**
 * Measure using Canvas measureText API
 */
function measureWithCanvas(text, fontSize, fontName) {
  if (!canvasContext) {
    const canvas = document.createElement('canvas');
    canvasContext = canvas.getContext('2d');
  }

  // Map PDF font to available font — each variant (e.g. 'Arial-Bold') is its own
  // family registered at normal weight/style, so no bold/italic CSS needed
  const mappedFont = mapToAvailableFont(fontName);
  canvasContext.font = `${fontSize}px "${mappedFont}", sans-serif`;

  const metrics = canvasContext.measureText(text);

  // Add 3% safety buffer for slight variations
  return metrics.width * 1.03;
}

/**
 * Enhanced character-based estimation (fallback)
 * More comprehensive than basic estimation
 */
function estimateWithCharacters(text, fontSize, fontName) {
  const avgWidths = {
    monospace: 0.6,
    sansSerif: 0.52,
    serif: 0.55,
    default: 0.55,
  };

  const category = getFontCategory(fontName);
  const baseWidth = avgWidths[category];

  // Adjust for character-specific widths
  let totalWidth = 0;
  for (const char of text) {
    if (/[WMwm@%]/.test(char)) totalWidth += 1.3;
    else if (/[iIlj1!|.',:;]/.test(char)) totalWidth += 0.4;
    else if (/[frt]/.test(char)) totalWidth += 0.6;
    else totalWidth += 1.0; //NOSONAR
  }

  return totalWidth * baseWidth * fontSize * 1.05; // 5% safety buffer
}

/**
 * Categorize font for width estimation
 */
function getFontCategory(fontName) {
  const lower = fontName.toLowerCase();
  if (/mono|courier|consolas/i.test(lower)) return 'monospace';
  if (/arial|helvetica|sans|verdana|roboto/i.test(lower)) return 'sansSerif';
  if (/times|serif|georgia|palatino/i.test(lower)) return 'serif';
  return 'default';
}

/**
 * Clear the measurement cache (useful for testing or memory management)
 */
export function clearWidthCache() {
  widthCache.clear();
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats() {
  return {
    size: widthCache.size,
    maxSize: MAX_CACHE_SIZE,
  };
}
