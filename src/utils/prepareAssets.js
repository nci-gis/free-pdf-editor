import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs';

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
      reject(`The script ${name} didn't load correctly.`);
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

// Available fonts
export const Fonts = {
  ...fonts,
  // Chinese
  標楷體: {
    src: ASSET_PATHS.fonts.chinese,
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2;
    },
  },
  // Sans-serif fonts
  Arial: {
    src: ASSET_PATHS.fonts.arial,
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 10;
    },
  },
  Roboto: {
    src: ASSET_PATHS.fonts.roboto,
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 10;
    },
  },
  'Open Sans': {
    src: ASSET_PATHS.fonts.openSans,
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 10;
    },
  },
  Lato: {
    src: ASSET_PATHS.fonts.lato,
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 10;
    },
  },
  // Serif fonts
  Merriweather: {
    src: ASSET_PATHS.fonts.merriweather,
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 7;
    },
  },
  // Monospace fonts
  'Roboto Mono': {
    src: ASSET_PATHS.fonts.robotoMono,
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 6;
    },
  },
  'Source Code Pro': {
    src: ASSET_PATHS.fonts.sourceCodePro,
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 6;
    },
  },
};

export function fetchFont(name) {
  if (fonts[name]) return fonts[name];
  const font = Fonts[name];
  if (!font) throw new Error(`Font '${name}' not exists.`);

  // Custom fonts already have buffer loaded
  if (font.buffer) {
    fonts[name] = Promise.resolve(font);
    return fonts[name];
  }

  // Built-in fonts need to be fetched
  fonts[name] = fetch(font.src)
    .then((r) => r.arrayBuffer())
    .then((fontBuffer) => {
      const fontFace = new FontFace(name, fontBuffer);
      fontFace.display = 'swap';
      fontFace.load().then(() => document.fonts.add(fontFace));
      return {
        ...font,
        buffer: fontBuffer,
      };
    });
  return fonts[name];
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
