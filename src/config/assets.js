// Centralized asset path configuration
// Use relative paths for file:// protocol compatibility
const BASE_PATH = '.';

export const ASSET_PATHS = {
  vendor: {
    // pdf.js is bundled via npm, no vendor file needed
    pdfLib: `${BASE_PATH}/assets/vendor/pdf-lib.min.js`,
    download: `${BASE_PATH}/assets/vendor/download.min.js`,
    makeTextPDF: `${BASE_PATH}/assets/vendor/makeTextPDF.js`,
  },
  fonts: {
    arial: `${BASE_PATH}/assets/fonts/ARIAL.TTF`,
    arialBold: `${BASE_PATH}/assets/fonts/ARIALBD.TTF`,
    arialItalic: `${BASE_PATH}/assets/fonts/ARIALI.TTF`,
    arialBoldItalic: `${BASE_PATH}/assets/fonts/ARIALBI.TTF`,
    // Sans-serif
    roboto: `${BASE_PATH}/assets/fonts/Roboto-Regular.ttf`,
    openSans: `${BASE_PATH}/assets/fonts/OpenSans-Regular.ttf`,
    lato: `${BASE_PATH}/assets/fonts/Lato-Regular.ttf`,
    // Serif
    merriweather: `${BASE_PATH}/assets/fonts/Merriweather-Regular.ttf`,
    // Monospace
    robotoMono: `${BASE_PATH}/assets/fonts/RobotoMono-Regular.ttf`,
    sourceCodePro: `${BASE_PATH}/assets/fonts/SourceCodePro-Regular.ttf`,
  },
};

export default ASSET_PATHS;
