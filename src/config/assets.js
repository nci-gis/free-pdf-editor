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
    chinese: `${BASE_PATH}/assets/fonts/CK.ttf`,
  },
};

export default ASSET_PATHS;
