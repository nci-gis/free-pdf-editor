const DB_NAME = 'pdf-editor-db';
const DB_VERSION = 1;
const STORE_NAME = 'file-handles';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'name' });
      }
    };
  });

  return dbPromise;
}

export async function storeFileHandle(name, handle) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({ name, handle });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('Failed to store file handle:', e);
  }
}

export async function getFileHandle(name) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(name);
      request.onsuccess = () => resolve(request.result?.handle);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('Failed to get file handle:', e);
    return null;
  }
}

export async function removeFileHandle(name) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('Failed to remove file handle:', e);
  }
}

export async function getFileFromHandle(handle) {
  if (!handle) return null;

  try {
    // Request permission if needed
    const permission = await handle.queryPermission({ mode: 'read' });
    if (permission === 'granted') {
      return await handle.getFile();
    }

    // Request permission from user
    const requestResult = await handle.requestPermission({ mode: 'read' });
    if (requestResult === 'granted') {
      return await handle.getFile();
    }

    return null;
  } catch (e) {
    console.warn('Failed to get file from handle:', e);
    return null;
  }
}

const LAST_DIR_KEY = '__last_directory__';

export async function storeLastDirectory(dirHandle) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({ name: LAST_DIR_KEY, handle: dirHandle });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('Failed to store last directory:', e);
  }
}

export async function getLastDirectory() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(LAST_DIR_KEY);
      request.onsuccess = () => resolve(request.result?.handle);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('Failed to get last directory:', e);
    return null;
  }
}
