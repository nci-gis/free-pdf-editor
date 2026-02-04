<script>
  import { onMount } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { fly, slide } from 'svelte/transition';

  import Drawing from './components/Drawing.svelte';
  import DrawingCanvas from './components/DrawingCanvas.svelte';
  import DropZone from './components/DropZone.svelte';
  import FirstLaunchModal from './components/FirstLaunchModal.svelte';
  import Image from './components/Image.svelte';
  import PDFPage from './components/PDFPage.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Tailwind from './components/Tailwind.svelte';
  import Text from './components/Text.svelte';
  import Tips from './components/Tips.svelte';
  import Toast from './components/Toast.svelte';
  import { EditableTextLayer, extractTextFromPage, groupTextIntoLines, NoticeModal } from './libs/textReplace';
  import { readAsDataURL, readAsImage, readAsPDF } from './utils/asyncReader.js';
  import { ggID } from './utils/helper.js';
  import { save } from './utils/PDF.js';
  import prepareAssets, { fetchFont } from './utils/prepareAssets.js';
  import {
  getFileFromHandle,
  getFileHandle,
  getLastDirectory,
  removeFileHandle,
  storeFileHandle,
  storeLastDirectory,
} from './utils/fileHandleStorage.js';
import { addRecentFile, clearRecentFiles, getRecentFiles, removeRecentFile } from './utils/recentFiles.js';

  const genID = ggID();
  let pdfFile = $state();
  let pdfName = $state('');
  let pages = $state([]);
  let pagesScale = $state([]);
  let allObjects = $state([]);
  let currentFont = $state('Times-Roman');
  let selectedPageIndex = $state(-1);
  let saving = $state(false);
  let saveProgress = $state(0);
  let addingDrawing = $state(false);
  let loading = $state(false);
  let recentFiles = $state([]);
  let toast = $state(null);
  let selectedTextBlock = $state(null); // Replace-text mode selection
  let editableLayers = $state([]); // refs to per-page EditableTextLayer

  // Replace text mode state
  let editMode = $state(false);
  let extractedTextByPage = $state([]);
  let editedTextByPage = $state([]);
  let textExtractionInProgress = $state(false);
  let debugOverlay = $state(false); // Show detected text blocks overlay
  let showNoticeModal = $state(false); // Notice popup for replace text mode
  let showFirstLaunchModal = $state(true); // First launch welcome modal
  let showTips = $state(false); // Tips popup

  // Sidebar selection state
  let selectedObjectId = $state(null);

  // Derived: get selected object
  let selectedObject = $derived.by(() => {
    // selectedObjectId can legitimately be 0 (first generated id), so test for null/undefined instead of falsy.
    if (selectedPageIndex < 0 || selectedObjectId == null) return null;
    return allObjects[selectedPageIndex]?.find((obj) => obj.id === selectedObjectId) || null;
  });

  onMount(() => {
    recentFiles = getRecentFiles();
    prepareAssets();
  });

  function showToast(message, type = 'success', duration = 3000) {
    toast = { message, type, duration };
  }

  function hideToast() {
    toast = null;
  }

  function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      savePDF();
    }
    // Toggle Tips with F1
    if (e.key === 'F1') {
      e.preventDefault();
      showTips = !showTips;
    }
    // Toggle edit mode with E key
    if (e.key === 'e' && !e.ctrlKey && !e.metaKey && pages.length > 0) {
      const target = e.target;
      // Don't trigger if typing in an input or contenteditable
      if (target.tagName !== 'INPUT' && !target.isContentEditable) {
        toggleEditMode();
      }
    }
    // Toggle debug overlay with D key (only in edit mode)
    if (e.key === 'd' && !e.ctrlKey && !e.metaKey && editMode) {
      const target = e.target;
      if (target.tagName !== 'INPUT' && !target.isContentEditable) {
        debugOverlay = !debugOverlay;
        showToast(debugOverlay ? 'Debug overlay enabled' : 'Debug overlay disabled', 'info', 1500);
      }
    }
  }

  // Replace text mode functions
  async function toggleEditMode() {
    if (!editMode) {
      await enterEditMode();
    } else {
      exitEditMode();
    }
  }

  async function enterEditMode() {
    if (textExtractionInProgress) return;
    textExtractionInProgress = true;

    try {
      // Extract text from all pages
      const extracted = await Promise.all(
        pages.map(async (page) => {
          const items = await extractTextFromPage(page);
          return groupTextIntoLines(items);
        })
      );
      extractedTextByPage = extracted;
      editedTextByPage = pages.map(() => new Map());
      editMode = true;
      showNoticeModal = true; // Show notice popup (will auto-close if already seen)
    } catch (e) {
      console.error('Failed to extract text:', e);
      showToast('Failed to extract text from PDF', 'error');
    } finally {
      textExtractionInProgress = false;
    }
  }

  function exitEditMode() {
    editMode = false;
    debugOverlay = false;
    selectedTextBlock = null;
    // Keep editedTextByPage for saving
    const editCount = editedTextByPage.reduce((sum, map) => sum + map.size, 0);
    if (editCount > 0) {
      showToast(`Replace text mode disabled. ${editCount} change(s) will be saved.`, 'info', 3000);
    } else {
      showToast('Replace text mode disabled', 'info', 2000);
    }
  }

  function updateEditedText(pageIndex, detail) {
    const { id, ...editData } = detail;
    editedTextByPage[pageIndex].set(id, editData);
    editedTextByPage = [...editedTextByPage]; // Trigger reactivity
  }

  function handleReplaceBlockSelect(pageIndex, detail) {
    if (detail === null) {
      selectedTextBlock = null;
      return;
    }
    selectedTextBlock = { pageIndex, ...detail };
  }

  function updateSelectedTextBlockFont(payload) {
    if (!selectedTextBlock) return;
    const layer = editableLayers[selectedTextBlock.pageIndex];
    layer?.applyFontAndSizeToBlock(selectedTextBlock.id, payload);
    selectedTextBlock = { ...selectedTextBlock, ...payload };
  }

  function updateSelectedTextBlockDimensions(payload) {
    if (!selectedTextBlock) return;
    const layer = editableLayers[selectedTextBlock.pageIndex];
    layer?.applyDimensionsToBlock(selectedTextBlock.id, payload);
    selectedTextBlock = { ...selectedTextBlock, ...payload };
  }

  async function onUploadPDF(eventOrDetail) {
    // Handle both DOM events (from <input>) and callback prop detail (from DropZone)
    const files = eventOrDetail.target?.files || eventOrDetail.files;
    const file = files?.[0];
    const fileHandle = eventOrDetail.fileHandle; // FileSystemFileHandle from drop or picker
    if (!file || file.type !== 'application/pdf') {
      if (file) showToast('Please select a valid PDF file', 'error');
      return;
    }
    selectedPageIndex = -1;
    loading = true;
    try {
      await addPDF(file);
      selectedPageIndex = 0;
      recentFiles = addRecentFile(file.name, file.size);
      // Store file handle for recent files feature
      if (fileHandle) {
        await storeFileHandle(file.name, fileHandle);
      }
      showToast(`Opened ${file.name}`, 'success', 2000);
    } catch (e) {
      console.log(e);
      showToast('Failed to open PDF file', 'error');
    } finally {
      loading = false;
    }
  }

  async function openFilePicker() {
    if (window.showOpenFilePicker) {
      try {
        // Get last directory to start from
        const lastDir = await getLastDirectory();
        const options = {
          types: [
            {
              description: 'PDF files',
              accept: { 'application/pdf': ['.pdf'] },
            },
          ],
          multiple: false,
        };
        if (lastDir) {
          options.startIn = lastDir;
        }

        const [fileHandle] = await window.showOpenFilePicker(options);
        const file = await fileHandle.getFile();

        // Store the directory for next time
        try {
          const dirHandle = await fileHandle.getParent?.();
          if (dirHandle) {
            await storeLastDirectory(dirHandle);
          }
        } catch {
          // getParent may not be supported in all browsers
        }

        await onUploadPDF({ files: [file], fileHandle });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('File picker error:', err);
        }
      }
    }
  }

  async function onOpenRecentFile(detail) {
    const { file: recentFile } = detail;
    loading = true;
    try {
      const handle = await getFileHandle(recentFile.name);
      if (!handle) {
        showToast(`File "${recentFile.name}" is no longer available`, 'error');
        recentFiles = removeRecentFile(recentFile.name);
        await removeFileHandle(recentFile.name);
        return;
      }

      const file = await getFileFromHandle(handle);
      if (!file) {
        showToast(`Cannot access "${recentFile.name}". Permission denied or file moved.`, 'error');
        recentFiles = removeRecentFile(recentFile.name);
        await removeFileHandle(recentFile.name);
        return;
      }

      selectedPageIndex = -1;
      await addPDF(file);
      selectedPageIndex = 0;
      recentFiles = addRecentFile(file.name, file.size);
      showToast(`Opened ${file.name}`, 'success', 2000);
    } catch (e) {
      console.log(e);
      showToast(`Failed to open "${recentFile.name}"`, 'error');
      recentFiles = removeRecentFile(recentFile.name);
      await removeFileHandle(recentFile.name);
    } finally {
      loading = false;
    }
  }

  async function onRemoveRecentFile(detail) {
    const { file: recentFile } = detail;
    recentFiles = removeRecentFile(recentFile.name);
    await removeFileHandle(recentFile.name);
    showToast(`Removed "${recentFile.name}" from recent files`, 'info', 2000);
  }

  async function onClearAllRecentFiles() {
    // Remove all file handles from IndexedDB
    for (const file of recentFiles) {
      await removeFileHandle(file.name);
    }
    recentFiles = clearRecentFiles();
    showToast('Cleared all recent files', 'info', 2000);
  }

  async function addPDF(file) {
    try {
      const pdf = await readAsPDF(file);
      pdfName = file.name;
      pdfFile = file;
      const numPages = pdf.numPages;
      pages = Array(numPages)
        .fill()
        .map((_, i) => pdf.getPage(i + 1));
      allObjects = pages.map(() => []);
      pagesScale = Array(numPages).fill(1);
      // Reset edit mode state
      editMode = false;
      extractedTextByPage = [];
      editedTextByPage = [];
      selectedTextBlock = null;
    } catch (e) {
      console.log('Failed to add pdf.');
      throw e;
    }
  }

  async function onUploadImage(e) {
    const file = e.target.files[0];
    if (file && selectedPageIndex >= 0) {
      addImage(file);
    }
    e.target.value = null;
  }

  async function addImage(file) {
    try {
      const url = await readAsDataURL(file);
      const img = await readAsImage(url);
      const id = genID();
      const { width, height } = img;
      const object = {
        id,
        type: 'image',
        width,
        height,
        x: 0,
        y: 0,
        payload: img,
        file,
      };
      selectedObjectId = id; // Set before adding to ensure isSelected is true on mount
      allObjects = allObjects.map((objects, pIndex) => (pIndex === selectedPageIndex ? [...objects, object] : objects));
    } catch (e) {
      console.log(`Fail to add image.`, e);
      showToast('Failed to add image', 'error');
    }
  }

  function onAddTextField() {
    if (selectedPageIndex >= 0) {
      addTextField();
    }
  }

  function addTextField(text = 'New Text Field') {
    const id = genID();
    fetchFont(currentFont);
    const object = {
      id,
      text,
      type: 'text',
      size: 16,
      width: 0,
      lineHeight: 1.4,
      fontFamily: currentFont,
      x: 0,
      y: 0,
    };
    selectedObjectId = id; // Set before adding to ensure isSelected is true on mount
    allObjects = allObjects.map((objects, pIndex) => (pIndex === selectedPageIndex ? [...objects, object] : objects));
  }

  function onAddDrawing() {
    if (selectedPageIndex >= 0) {
      addingDrawing = true;
    }
  }

  function addDrawing(originWidth, originHeight, path, scale = 1) {
    const id = genID();
    const object = {
      id,
      path,
      type: 'drawing',
      x: 0,
      y: 0,
      originWidth,
      originHeight,
      width: originWidth * scale,
      scale,
    };
    selectedObjectId = id; // Set before adding to ensure isSelected is true on mount
    allObjects = allObjects.map((objects, pIndex) => (pIndex === selectedPageIndex ? [...objects, object] : objects));
  }

  function selectFontFamily(detail) {
    const name = detail.name;
    fetchFont(name);
    currentFont = name;
  }

  function selectPage(index) {
    selectedPageIndex = index;
    selectedTextBlock = null;
  }

  function updateObject(objectId, payload) {
    allObjects = allObjects.map((objects, pIndex) =>
      pIndex == selectedPageIndex
        ? objects.map((object) => (object.id === objectId ? { ...object, ...payload } : object))
        : objects
    );
  }

  function deleteObject(objectId) {
    allObjects = allObjects.map((objects, pIndex) =>
      pIndex == selectedPageIndex ? objects.filter((object) => object.id !== objectId) : objects
    );
    // Clear selection if deleted object was selected
    if (selectedObjectId === objectId) {
      selectedObjectId = null;
    }
  }

  function selectObject(detail) {
    selectedObjectId = detail.id;
  }

  function deselectAll() {
    selectedObjectId = null;
  }

  function onMeasure(scale, i) {
    pagesScale[i] = scale;
  }

  async function savePDF() {
    if (!pdfFile || saving || !pages.length) return;
    saving = true;
    saveProgress = 0;
    try {
      await save(pdfFile, allObjects, editedTextByPage, pdfName, (progress) => {
        saveProgress = progress;
      });
      showToast('PDF saved successfully!', 'success');
      // Clear edited text after successful save
      editedTextByPage = pages.map(() => new Map());
    } catch (e) {
      console.log(e);
      showToast('Failed to save PDF', 'error');
    } finally {
      saving = false;
      saveProgress = 0;
    }
  }
</script>

<svelte:window
  ondragenter={(e) => e.preventDefault()}
  ondragover={(e) => e.preventDefault()}
  ondrop={async (e) => {
    e.preventDefault();
    const items = e.dataTransfer?.items;
    if (items?.length > 0) {
      const item = items[0];
      if (item.kind === 'file') {
        let fileHandle = null;
        if (item.getAsFileSystemHandle) {
          try {
            fileHandle = await item.getAsFileSystemHandle();
            // Store the directory for next time
            try {
              const dirHandle = await fileHandle.getParent?.();
              if (dirHandle) {
                await storeLastDirectory(dirHandle);
              }
            } catch {
              // getParent may not be supported
            }
          } catch (err) {
            console.warn('Could not get file handle:', err);
          }
        }
        const file = item.getAsFile();
        if (file) {
          onUploadPDF({ files: [file], fileHandle });
        }
      }
    }
  }}
  onkeydown={handleKeydown}
/>
<Tailwind />

{#if toast}
  <Toast message={toast.message} type={toast.type} duration={toast.duration} onClose={hideToast} />
{/if}

<FirstLaunchModal bind:show={showFirstLaunchModal} />

<NoticeModal show={showNoticeModal} onclose={() => (showNoticeModal = false)} />

<Tips bind:isOpen={showTips} />

<main class="flex h-screen pt-14 bg-gray-50">
  <!-- Modern Header -->
  <header
    class="fixed z-10 top-0 left-0 right-0 h-14 flex items-center justify-between
    px-4 bg-white border-b border-gray-200 shadow-sm"
  >
    <!-- Left: File controls -->
    <div class="flex items-center gap-2">
      <button
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800
        text-white text-sm font-medium rounded-lg cursor-pointer transition-colors shadow-sm"
        onclick={openFilePicker}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        <span class="hidden sm:inline">Open PDF</span>
      </button>
    </div>

    <!-- Center: Tools (only when PDF loaded) -->
    {#if pages.length > 0}
      <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <!-- Annotation tools (hidden in edit mode) -->
        {#if !editMode}
          <div class="flex items-center gap-1" transition:slide={{ duration: 250, axis: 'x', easing: cubicInOut }}>
            <input type="file" id="image" name="image" accept="image/*" class="hidden" onchange={onUploadImage} />
            <label
              class="flex items-center justify-center w-9 h-9 rounded-md hover:bg-white hover:shadow-sm
              cursor-pointer transition-all"
              for="image"
              title="Add Image"
              class:opacity-50={selectedPageIndex < 0}
              class:cursor-not-allowed={selectedPageIndex < 0}
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </label>
            <button
              class="flex items-center justify-center w-9 h-9 rounded-md hover:bg-white hover:shadow-sm
              cursor-pointer transition-all"
              title="Add Text"
              onclick={onAddTextField}
              class:opacity-50={selectedPageIndex < 0}
              class:cursor-not-allowed={selectedPageIndex < 0}
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              class="flex items-center justify-center w-9 h-9 rounded-md hover:bg-white hover:shadow-sm
              cursor-pointer transition-all"
              title="Add Drawing"
              onclick={onAddDrawing}
              class:opacity-50={selectedPageIndex < 0}
              class:cursor-not-allowed={selectedPageIndex < 0}
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
            <div class="w-px h-6 bg-gray-300 mx-1"></div>
          </div>
        {/if}
        <!-- Replace Text button (always visible) -->
        <button
          class="flex items-center justify-center px-2 h-9 rounded-md transition-all gap-1
          {editMode ? 'bg-amber-500 text-white hover:bg-amber-600' : 'hover:bg-white hover:shadow-sm text-gray-600'}"
          title="Replace text (visual) - works best on simple PDFs (E)"
          onclick={toggleEditMode}
          disabled={textExtractionInProgress}
        >
          {#if textExtractionInProgress}
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          {:else}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          {/if}
          <span class="hidden sm:inline text-xs font-medium">{editMode ? 'Exit' : 'Replace Text'}</span>
        </button>
      </div>

      <!-- Filename input -->
      <div class="hidden md:flex items-center gap-2 flex-1 max-w-xs mx-4">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        <input
          placeholder="filename.pdf"
          type="text"
          class="flex-grow bg-transparent text-sm text-gray-700 focus:outline-none"
          bind:value={pdfName}
        />
      </div>
    {/if}

    <!-- Right: Save button -->
    <div class="flex items-center gap-2">
      {#if pages.length > 0}
        <button
          onclick={savePDF}
          disabled={pages.length === 0 || saving || !pdfFile}
          class="relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
          transition-colors shadow-sm overflow-hidden
          {saving ? 'bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'}
          disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if saving}
            <div class="absolute inset-0 bg-blue-500 transition-all" style="width: {saveProgress}%"></div>
            <span class="relative flex items-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {saveProgress}%
            </span>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            <span class="hidden sm:inline">Save</span>
          {/if}
        </button>
        <span class="hidden md:inline text-xs text-gray-400">Ctrl+S</span>
      {/if}
    </div>
  </header>

  {#if addingDrawing}
    <div
      transition:fly={{ y: -200, duration: 500 }}
      class="fixed z-20 top-14 left-0 right-0 border-b border-gray-200 bg-white shadow-lg"
      style="height: 50%;"
    >
      <DrawingCanvas
        onfinish={(detail) => {
          const { originWidth, originHeight, path } = detail;
          let scale = 1;
          if (originWidth > 500) {
            scale = 500 / originWidth;
          }
          addDrawing(originWidth, originHeight, path, scale);
          addingDrawing = false;
        }}
        oncancel={() => (addingDrawing = false)}
      />
    </div>
  {/if}

  <!-- Main Content Area -->
  <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
  <div class="flex-1 overflow-auto flex flex-col items-center" onclick={deselectAll}>
    {#if pages.length}
      <!-- Mobile filename input -->
      <div class="flex md:hidden justify-center px-5 py-3 w-full bg-white border-b border-gray-100">
        <div class="flex items-center gap-2 w-full max-w-md">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <input placeholder="filename.pdf" type="text" class="flex-grow bg-transparent text-sm" bind:value={pdfName} />
        </div>
      </div>

      <div class="w-full py-4">
        {#each pages as page, pIndex (page)}
          <div
            class="px-4 py-3 w-full flex flex-col items-center"
            role="button"
            tabindex="0"
            aria-label="Select page {pIndex + 1}"
            onmousedown={() => selectPage(pIndex)}
            ontouchstart={() => selectPage(pIndex)}
            onkeydown={(e) => e.key === 'Enter' && selectPage(pIndex)}
          >
            <div
              class="relative bg-white rounded-lg transition-shadow"
              class:shadow-lg={pIndex !== selectedPageIndex}
              class:shadow-xl={pIndex === selectedPageIndex}
              class:ring-2={pIndex === selectedPageIndex}
              class:ring-blue-500={pIndex === selectedPageIndex}
            >
              <PDFPage onmeasure={(detail) => onMeasure(detail.scale, pIndex)} {page} />
              <div
                class="absolute top-0 left-0 transform origin-top-left"
                style="transform: scale({pagesScale[pIndex]}); touch-action: none;"
              >
                {#if editMode && extractedTextByPage[pIndex]}
                  <!-- Replace text mode: show editable text layer -->
                  <EditableTextLayer
                    bind:this={editableLayers[pIndex]}
                    textLines={extractedTextByPage[pIndex]}
                    editedItems={editedTextByPage[pIndex]}
                    showDebugOverlay={debugOverlay}
                    pageScale={pagesScale[pIndex]}
                    ontextchange={(detail) => updateEditedText(pIndex, detail)}
                    onblockselect={(detail) => handleReplaceBlockSelect(pIndex, detail)}
                  />
                {:else}
                  <!-- Normal mode: show annotations -->
                  {#each allObjects[pIndex] as object (object.id)}
                    {#if object.type === 'image'}
                      <Image
                        id={object.id}
                        onupdate={(detail) => updateObject(object.id, detail)}
                        ondelete={() => deleteObject(object.id)}
                        onselect={selectObject}
                        isSelected={selectedObjectId === object.id}
                        file={object.file}
                        payload={object.payload}
                        x={object.x}
                        y={object.y}
                        width={object.width}
                        height={object.height}
                        pageScale={pagesScale[pIndex]}
                      />
                    {:else if object.type === 'text'}
                      <Text
                        id={object.id}
                        onupdate={(detail) => updateObject(object.id, detail)}
                        ondelete={() => deleteObject(object.id)}
                        onselect={selectObject}
                        isSelected={selectedObjectId === object.id}
                        text={object.text}
                        x={object.x}
                        y={object.y}
                        size={object.size}
                        lineHeight={object.lineHeight}
                        fontFamily={object.fontFamily}
                        pageScale={pagesScale[pIndex]}
                      />
                    {:else if object.type === 'drawing'}
                      <Drawing
                        id={object.id}
                        onupdate={(detail) => updateObject(object.id, detail)}
                        ondelete={() => deleteObject(object.id)}
                        onselect={selectObject}
                        isSelected={selectedObjectId === object.id}
                        path={object.path}
                        x={object.x}
                        y={object.y}
                        width={object.width}
                        originWidth={object.originWidth}
                        originHeight={object.originHeight}
                        pageScale={pagesScale[pIndex]}
                      />
                    {/if}
                  {/each}
                {/if}
              </div>
            </div>
            <span class="mt-2 text-xs text-gray-400">Page {pIndex + 1}</span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="w-full flex-grow flex justify-center items-center p-8">
        <DropZone
          {recentFiles}
          {loading}
          onupload={onUploadPDF}
          onrecent={onOpenRecentFile}
          onremoverecent={onRemoveRecentFile}
          onclearall={onClearAllRecentFiles}
        />
      </div>
    {/if}
  </div>

  <!-- Right Sidebar -->
  {#if pages.length > 0}
    <Sidebar
      {selectedObject}
      {selectedTextBlock}
      {editMode}
      {currentFont}
      {textExtractionInProgress}
      {debugOverlay}
      editStats={{
        textBlocks: selectedPageIndex >= 0 ? (extractedTextByPage[selectedPageIndex]?.length ?? 0) : 0,
        edits: editedTextByPage.reduce((sum, map) => sum + map.size, 0),
      }}
      onupdateobject={updateObject}
      ondeleteobject={deleteObject}
      onselectfont={selectFontFamily}
      onupdatetextblockfont={updateSelectedTextBlockFont}
      onupdatetextblockdimensions={updateSelectedTextBlockDimensions}
      ontoggleeditmode={toggleEditMode}
      ontoggledebugoverlayupdate={() => {
        debugOverlay = !debugOverlay;
      }}
    />
  {/if}
</main>
