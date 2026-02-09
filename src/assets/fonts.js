// Import fonts as base64 data URLs (embedded in bundle)
// This avoids CORS issues when running from file:// protocol
// Note: Chinese font (CK.ttf) is NOT embedded to save bundle size (~10MB)
import arialUrl from './fonts/ARIAL.TTF';
import arialBoldUrl from './fonts/ARIALBD.TTF';
import arialBoldItalicUrl from './fonts/ARIALBI.TTF';
import arialItalicUrl from './fonts/ARIALI.TTF';
import latoUrl from './fonts/Lato-Regular.ttf';
import merriweatherUrl from './fonts/Merriweather-Regular.ttf';
import openSansUrl from './fonts/OpenSans-Regular.ttf';
import robotoUrl from './fonts/Roboto-Regular.ttf';
import robotoMonoUrl from './fonts/RobotoMono-Regular.ttf';
import sourceCodeProUrl from './fonts/SourceCodePro-Regular.ttf';

/**
 * Convert data URL to ArrayBuffer
 * @param {string} dataUrl - Base64 data URL
 * @returns {Promise<ArrayBuffer>}
 */
async function dataUrlToArrayBuffer(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Export font data URLs (will be converted to ArrayBuffer when needed)
// Chinese font is NOT included here - it will be lazy-loaded via fetch when needed
export const embeddedFonts = {
  arial: arialUrl,
  arialBold: arialBoldUrl,
  arialItalic: arialItalicUrl,
  arialBoldItalic: arialBoldItalicUrl,
  roboto: robotoUrl,
  robotoMono: robotoMonoUrl,
  openSans: openSansUrl,
  lato: latoUrl,
  merriweather: merriweatherUrl,
  sourceCodePro: sourceCodeProUrl,
};

/**
 * Load embedded font and return ArrayBuffer
 * @param {string} fontKey - Key from embeddedFonts
 * @returns {Promise<ArrayBuffer>}
 */
export async function loadEmbeddedFont(fontKey) {
  const dataUrl = embeddedFonts[fontKey];
  if (!dataUrl) {
    throw new Error(`Embedded font '${fontKey}' not found`);
  }
  return dataUrlToArrayBuffer(dataUrl);
}
