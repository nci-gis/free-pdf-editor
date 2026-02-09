import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs';

import { loadEmbeddedFont } from '../assets/fonts.js';
import { ASSET_PATHS } from '../config/assets.js';

// Create inline worker from bundled source (no separate file needed)
const workerBlob = new Blob([pdfjsWorker], { type: 'application/javascript' });
pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);

// Scripts loaded via script tags (UMD format)
const scripts = [
  { name: 'PDFLib', src: ASSET_PATHS.vendor.pdfLib },
  { name: 'download', src: ASSET_PATHS.vendor.download },
  { name: 'makeTextPDF', src: ASSET_PATHS.vendor.makeTextPDF },
];

const assets = {
  // pdf.js is bundled and available immediately
  pdfjsLib: Promise.resolve(pdfjsLib),
};

export function getAsset(name) {
  if (assets[name]) return assets[name];

  const script = scripts.find((s) => s.name === name);
  if (!script) throw new Error(`Script ${name} not exists.`);
  return prepareAsset(script);
}

export function prepareAsset({ name, src }) {
  if (assets[name]) return assets[name];
  assets[name] = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      const loadedAsset = window[name];
      resolve(loadedAsset);
      console.log(`${name} is loaded.`);
    };
    script.onerror = () => {
      reject(new Error(`The script ${name} didn't load correctly.`));
      alert(`Some scripts did not load correctly. Please reload and try again.`);
    };
    document.body.appendChild(script);
  });
  return assets[name];
}

export default function prepareAssets() {
  // pdf.js is already bundled, just load other scripts
  scripts.forEach(prepareAsset);
  console.log('pdfjsLib is bundled and ready.');
}

// out of the box fonts
const fonts = {
  Courier: {
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 6;
    },
  },
  Helvetica: {
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 10;
    },
  },
  'Times-Roman': {
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 7;
    },
  },
};

// Available fonts (now use embedded base64 fonts, no fetch needed!)
// Note: Chinese font removed - users can import it via "Import Font" button in sidebar
export const Fonts = {
  ...fonts,
  // Sans-serif fonts
  Arial: {
    embedded: 'arial',
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 10;
    },
  },
  'Arial-Bold': {
    embedded: 'arialBold',
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 10;
    },
  },
  'Arial-Italic': {
    embedded: 'arialItalic',
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 10;
    },
  },
  'Arial-BoldItalic': {
    embedded: 'arialBoldItalic',
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 10;
    },
  },
  Roboto: {
    embedded: 'roboto',
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 10;
    },
  },
  'Open Sans': {
    embedded: 'openSans',
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 10;
    },
  },
  Lato: {
    embedded: 'lato',
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 10;
    },
  },
  // Serif fonts
  Merriweather: {
    embedded: 'merriweather',
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 7;
    },
  },
  // Monospace fonts
  'Roboto Mono': {
    embedded: 'robotoMono',
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 6;
    },
  },
  'Source Code Pro': {
    embedded: 'sourceCodePro',
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 6;
    },
  },
};

export function fetchFont(name) {
  if (fonts[name]) return fonts[name];
  const font = Fonts[name];
  if (!font) throw new Error(`Font '${name}' not exists.`);

  // Custom fonts already have buffer loaded (e.g., user-uploaded fonts)
  if (font.buffer) {
    fonts[name] = Promise.resolve(font);
    return fonts[name];
  }

  // Load embedded fonts (bundled as base64, no fetch needed!)
  if (font.embedded) {
    fonts[name] = loadEmbeddedFont(font.embedded)
      .then((fontBuffer) => {
        // Register font for browser rendering
        const fontFace = new FontFace(name, fontBuffer, { display: 'swap' });
        fontFace.load().then(() => document.fonts.add(fontFace));
        return {
          ...font,
          buffer: fontBuffer,
        };
      })
      .catch((error) => {
        console.error(`Failed to load embedded font '${name}':`, error);
        // Fallback to built-in PDF font
        const fallbackName = getFallbackFont(name);
        return Fonts[fallbackName];
      });
    return fonts[name];
  }

  // Fallback: fetch from URL (for legacy/custom fonts not embedded)
  if (font.src) {
    fonts[name] = fetch(font.src)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then((fontBuffer) => {
        const fontFace = new FontFace(name, fontBuffer, { display: 'swap' });
        fontFace.load().then(() => document.fonts.add(fontFace));
        return {
          ...font,
          buffer: fontBuffer,
        };
      })
      .catch((error) => {
        console.warn(`Failed to fetch font '${name}': ${error.message}. Using fallback.`);
        const fallbackName = getFallbackFont(name);
        return Fonts[fallbackName];
      });
    return fonts[name];
  }

  // No loading needed (built-in PDF fonts like Helvetica, Courier, Times-Roman)
  fonts[name] = Promise.resolve(font);
  return fonts[name];
}

/**
 * Map custom fonts to built-in PDF fonts (Helvetica, Times-Roman, Courier)
 * These fonts don't need fetching and work in file:// protocol
 */
function getFallbackFont(fontName) {
  // Sans-serif fonts → Helvetica
  if (
    fontName.includes('Arial') ||
    fontName.includes('Roboto') ||
    fontName.includes('Sans') ||
    fontName.includes('Lato')
  ) {
    return 'Helvetica';
  }
  // Monospace fonts → Courier
  if (fontName.includes('Mono') || fontName.includes('Code') || fontName.includes('Courier')) {
    return 'Courier';
  }
  // Serif fonts → Times-Roman
  if (fontName.includes('Times') || fontName.includes('Merriweather') || fontName.includes('Serif')) {
    return 'Times-Roman';
  }
  // Default fallback
  return 'Helvetica';
}

/**
 * Add a custom font to the available fonts
 * @param {string} name - Font family name
 * @param {Object} fontData - Font data with buffer and correction function
 */
export function addCustomFont(name, fontData) {
  Fonts[name] = fontData;
  // Also add to loaded fonts cache if buffer exists
  if (fontData.buffer) {
    fonts[name] = Promise.resolve(fontData);
  }
}

/**
 * Remove a custom font from available fonts
 * @param {string} name - Font family name
 */
export function removeCustomFont(name) {
  delete Fonts[name];
  delete fonts[name];
}

/**
 * Get list of custom font names
 * @returns {string[]} Array of custom font names
 */
export function getCustomFontNames() {
  return Object.keys(Fonts).filter((name) => Fonts[name].isCustom);
}
