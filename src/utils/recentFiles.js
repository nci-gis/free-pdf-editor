const STORAGE_KEY = 'pdf-editor-recent-files';
const MAX_RECENT = 5;

export function getRecentFiles() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const files = JSON.parse(stored);
    return Array.isArray(files) ? files : [];
  } catch (e) {
    console.warn('Failed to read recent files from localStorage:', e);
    return [];
  }
}

export function addRecentFile(name, size = 0) {
  try {
    const files = getRecentFiles();

    // Remove existing entry with same name
    const filtered = files.filter(f => f.name !== name);

    // Add new entry at the beginning
    const newFile = {
      name,
      size,
      lastOpened: Date.now()
    };

    const updated = [newFile, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return updated;
  } catch (e) {
    console.warn('Failed to save recent file to localStorage:', e);
    return getRecentFiles();
  }
}

export function removeRecentFile(name) {
  try {
    const files = getRecentFiles();
    const filtered = files.filter(f => f.name !== name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.warn('Failed to remove recent file from localStorage:', e);
    return getRecentFiles();
  }
}

export function clearRecentFiles() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch (e) {
    console.warn('Failed to clear recent files from localStorage:', e);
    return [];
  }
}
