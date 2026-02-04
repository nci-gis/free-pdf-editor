<script>
  import { fade, scale } from 'svelte/transition';
  import { getLastDirectory, storeLastDirectory } from '../utils/fileHandleStorage.js';

  let { recentFiles = [], loading = false, onupload, onrecent, onremoverecent, onclearall } = $props();
  let isDragOver = $state(false);
  let dragCounter = $state(0);

  function handleDragEnter(e) {
    e.preventDefault();
    dragCounter++;
    isDragOver = true;
  }

  function handleDragLeave(e) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      isDragOver = false;
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  async function handleDrop(e) {
    e.preventDefault();
    isDragOver = false;
    dragCounter = 0;

    // Try to get file handle from dataTransfer (File System Access API)
    const items = e.dataTransfer?.items;
    if (items?.length > 0) {
      const item = items[0];
      if (item.kind === 'file') {
        let fileHandle = null;
        // Try to get FileSystemFileHandle if supported
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
          onupload?.({ files: [file], fileHandle });
        }
      }
    }
  }

  async function handleFileSelect() {
    // Use File System Access API if available for better recent files support
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

        onupload?.({ files: [file], fileHandle });
      } catch (err) {
        // User cancelled or API not supported
        if (err.name !== 'AbortError') {
          console.warn('File picker error:', err);
        }
      }
    }
  }

  function handleRecentClick(file) {
    onrecent?.({ file });
  }

  function handleRemoveClick(e, file) {
    e.stopPropagation();
    onremoverecent?.({ file });
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<div
  class="w-full max-w-2xl mx-auto flex flex-col items-center"
  role="region"
  aria-label="PDF upload area"
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  ondragover={handleDragOver}
  ondrop={handleDrop}
>
  <div
    class="w-full p-12 border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-4
    {isDragOver ? 'border-blue-500 bg-blue-50 scale-102' : 'border-gray-300 bg-white hover:border-gray-400'}"
    class:animate-pulse={isDragOver}
  >
    {#if loading}
      <div class="flex flex-col items-center gap-4" transition:fade>
        <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-gray-600 font-medium">Loading PDF...</p>
      </div>
    {:else}
      <div class="text-gray-400" transition:scale>
        <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>

      <div class="text-center">
        <p class="text-xl font-semibold text-gray-700">
          {isDragOver ? 'Drop your PDF here' : 'Drag & drop your PDF'}
        </p>
        <p class="text-gray-500 mt-1">or</p>
      </div>

      <button
        class="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
        onclick={handleFileSelect}
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        Browse files
      </button>
    {/if}
  </div>

  {#if recentFiles.length > 0 && !loading}
    <div class="w-full mt-8" transition:fade>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium text-gray-500 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Recent Files
        </h3>
        <button
          class="text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          onclick={() => onclearall?.()}
        >
          Clear All
        </button>
      </div>
      <div class="space-y-2">
        {#each recentFiles as file}
          <div class="w-full flex items-center gap-2">
            <button
              class="flex-1 flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group cursor-pointer"
              onclick={() => handleRecentClick(file)}
            >
              <div class="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="flex-grow min-w-0">
                <p class="font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                  {file.name}
                </p>
                <p class="text-sm text-gray-500">{formatDate(file.lastOpened)}</p>
              </div>
              <svg
                class="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              class="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove from recent files"
              onclick={(e) => handleRemoveClick(e, file)}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
