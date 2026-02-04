// Custom fonts storage using IndexedDB
const DB_NAME = 'pdf-editor-fonts';
const DB_VERSION = 1;
const STORE_NAME = 'fonts';

let db = null;

/**
 * Initialize IndexedDB for font storage
 */
function openDB() {
  if (db) return Promise.resolve(db);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'name' });
      }
    };
  });
}

/**
 * Save a custom font to IndexedDB
 * @param {string} name - Font family name
 * @param {ArrayBuffer} buffer - Font file data
 * @param {string} fileName - Original file name
 */
export async function saveCustomFont(name, buffer, fileName) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const fontData = {
      name,
      buffer,
      fileName,
      addedAt: Date.now(),
    };

    const request = store.put(fontData);
    request.onsuccess = () => resolve(fontData);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all custom fonts from IndexedDB
 * @returns {Promise<Array>} Array of font objects
 */
export async function getCustomFonts() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a custom font from IndexedDB
 * @param {string} name - Font family name
 */
export async function deleteCustomFont(name) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(name);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Register a font with the browser's FontFace API
 * @param {string} name - Font family name
 * @param {ArrayBuffer} buffer - Font file data
 */
export async function registerFontFace(name, buffer) {
  const fontFace = new FontFace(name, buffer);
  fontFace.display = 'swap';
  await fontFace.load();
  document.fonts.add(fontFace);
  return fontFace;
}

/**
 * Load and register all custom fonts from IndexedDB
 * @returns {Promise<Object>} Map of font name to font data
 */
export async function loadAllCustomFonts() {
  const customFonts = await getCustomFonts();
  const loaded = {};

  for (const font of customFonts) {
    try {
      await registerFontFace(font.name, font.buffer);
      loaded[font.name] = {
        buffer: font.buffer,
        isCustom: true,
        correction(size, lineHeight) {
          // Default correction for custom fonts
          return (size * lineHeight - size) / 2 + size / 10;
        },
      };
      console.log(`Custom font '${font.name}' loaded.`);
    } catch (error) {
      console.error(`Failed to load custom font '${font.name}':`, error);
    }
  }

  return loaded;
}

/**
 * Import a font file and save it
 * @param {File} file - Font file (.ttf, .otf)
 * @returns {Promise<Object>} Font data
 */
export async function importFontFile(file) {
  // Extract font name from filename (remove extension)
  const name = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '').replace(/[-_]/g, ' ');

  const buffer = await file.arrayBuffer();

  // Register with browser
  await registerFontFace(name, buffer);

  // Save to IndexedDB
  await saveCustomFont(name, buffer, file.name);

  return {
    name,
    buffer,
    fileName: file.name,
    isCustom: true,
    correction(size, lineHeight) {
      return (size * lineHeight - size) / 2 + size / 10;
    },
  };
}
