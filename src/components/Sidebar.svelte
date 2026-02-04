<script>
  import { clearAllCustomFonts, importFontFile, loadAllCustomFonts } from '@src/utils/customFonts.js';
  import { addCustomFont, Fonts } from '@src/utils/prepareAssets.js';
  import { removeCustomFont } from '@src/utils/prepareAssets.js';
  import { clearRecentFiles } from '@src/utils/recentFiles.js';
  import { onMount } from 'svelte';

  import DrawingProperties from './sidebar/DrawingProperties.svelte';
  import ImageProperties from './sidebar/ImageProperties.svelte';
  import TextProperties from './sidebar/TextProperties.svelte';

  let {
    selectedObject = null,
    selectedTextBlock = null,
    editMode = false,
    currentFont = 'Times-Roman',
    textExtractionInProgress = false,
    debugOverlay = false,
    editStats = { textBlocks: 0, edits: 0 },
    onupdateobject,
    ondeleteobject,
    onselectfont,
    onupdatetextblockfont,
    onupdatetextblockdimensions,
    ontoggleeditmode,
    ontoggledebugoverlayupdate,
  } = $props();

  const STORAGE_KEY = 'pdf-editor-sidebar-collapsed';
  let collapsed = $state(false);
  let isMobile = $state(false);
  let fontFamilies = $state(Object.keys(Fonts));
  let customFontNames = $state([]);
  let fontInputRef = $state();
  let importing = $state(false);
  let clearing = $state(false);

  onMount(async () => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      collapsed = saved === 'true';
    }

    // Check mobile breakpoint
    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Load custom fonts from IndexedDB
    try {
      const loadedFonts = await loadAllCustomFonts();
      for (const [name, fontData] of Object.entries(loadedFonts)) {
        addCustomFont(name, fontData);
      }
      updateFontList();
    } catch (error) {
      console.error('Failed to load custom fonts:', error);
    }

    return () => window.removeEventListener('resize', checkMobile);
  });

  function updateFontList() {
    fontFamilies = Object.keys(Fonts);
    customFontNames = fontFamilies.filter((name) => Fonts[name]?.isCustom);
  }

  function toggleCollapsed() {
    collapsed = !collapsed;
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }

  function handleFontPresetChange(e) {
    onselectfont?.({ name: e.target.value });
  }

  function triggerFontImport() {
    fontInputRef?.click();
  }

  async function handleFontFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    importing = true;
    try {
      const fontData = await importFontFile(file);
      addCustomFont(fontData.name, fontData);
      updateFontList();
      // Auto-select the newly imported font
      onselectfont?.({ name: fontData.name });
    } catch (error) {
      console.error('Failed to import font:', error);
      alert(`Failed to import font: ${error.message}`);
    } finally {
      importing = false;
      // Reset input
      e.target.value = '';
    }
  }

  async function handleClearCache() {
    if (!confirm('This will clear all custom fonts, recent files, and settings. Continue?')) {
      return;
    }

    clearing = true;
    try {
      // Clear custom fonts from IndexedDB
      await clearAllCustomFonts();
      // Remove custom fonts from memory
      for (const name of customFontNames) {
        removeCustomFont(name);
      }

      // Clear recent files
      clearRecentFiles();

      // Clear sidebar state
      localStorage.removeItem(STORAGE_KEY);

      // Update font list
      updateFontList();

      // Reset to default font
      onselectfont?.({ name: 'Times-Roman' });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert(`Failed to clear cache: ${error.message}`);
    } finally {
      clearing = false;
    }
  }
</script>

{#if !isMobile}
  <aside
    class="h-full bg-white border-l border-gray-200 flex flex-col transition-all duration-300 overflow-hidden"
    style="width: {collapsed ? '48px' : '280px'};"
  >
    <!-- Header -->
    <div class="flex items-center justify-between h-12 px-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
      {#if !collapsed}
        <span class="text-sm font-medium text-gray-700">Properties</span>
      {/if}
      <button
        onclick={toggleCollapsed}
        class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          class="w-4 h-4 text-gray-600 transition-transform duration-300"
          class:rotate-180={collapsed}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    {#if !collapsed}
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- Edit Mode Properties -->
        {#if editMode}
          <div class="space-y-5">
            <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Replace Text Mode</div>

            <!-- Status -->
            <div class="bg-amber-50 border border-amber-200 rounded-md p-3 space-y-2">
              <div class="flex items-center gap-2 text-amber-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-sm font-medium">Active</span>
              </div>
              <p class="text-xs text-amber-600">
                Click on any text to edit it. Changes are saved when you export the PDF.
              </p>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-gray-50 rounded-md p-3 text-center">
                <div class="text-2xl font-semibold text-gray-700">{editStats.textBlocks}</div>
                <div class="text-xs text-gray-500">Text Blocks</div>
              </div>
              <div class="bg-gray-50 rounded-md p-3 text-center">
                <div class="text-2xl font-semibold text-blue-600">{editStats.edits}</div>
                <div class="text-xs text-gray-500">Edits Made</div>
              </div>
            </div>

            <!-- Selected text block controls -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">Selection</span>
                {#if selectedTextBlock}
                  <span class="text-xs text-gray-500">ID {selectedTextBlock.id}</span>
                {:else}
                  <span class="text-xs text-gray-400">None</span>
                {/if}
              </div>

              {#if selectedTextBlock}
                <div class="space-y-2">
                  <div class="space-y-1">
                    <label class="text-sm text-gray-600" for="replace-font-select">Font</label>
                    <select
                      id="replace-font-select"
                      value={selectedTextBlock.fontName}
                      onchange={(e) => onupdatetextblockfont?.({ fontName: e.target.value })}
                      class="w-full h-8 px-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {#each fontFamilies as family}
                        <option value={family}>
                          {family}{customFontNames.includes(family) ? ' ★' : ''}
                        </option>
                      {/each}
                    </select>
                  </div>

                  <div class="space-y-1">
                    <label class="text-sm text-gray-600" for="replace-size-input">Size</label>
                    <div class="flex items-center gap-2">
                      <input
                        id="replace-size-input"
                        type="number"
                        min="1"
                        max="64"
                        step="0.5"
                        value={selectedTextBlock.fontSizeAuto ? '' : selectedTextBlock.fontSize}
                        placeholder={`Auto (${Math.round(selectedTextBlock.fontSize ?? 12)})`}
                        oninput={(e) => {
                          const val = parseFloat(e.target.value);
                          if (Number.isFinite(val)) {
                            onupdatetextblockfont?.({
                              fontSizeAuto: false,
                              fontSize: Math.min(64, Math.max(1, val)),
                            });
                          }
                        }}
                        class="w-full h-8 px-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={selectedTextBlock.fontSizeAuto}
                      />
                      <label class="inline-flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={selectedTextBlock.fontSizeAuto}
                          onchange={(e) => onupdatetextblockfont?.({ fontSizeAuto: e.target.checked })}
                        />
                        Auto
                      </label>
                    </div>
                  </div>

                  <!-- Dimensions -->
                  <div class="space-y-1">
                    <label class="text-sm text-gray-600" for="replace-width-input">Dimensions</label>
                    <div class="flex items-center gap-2">
                      <div class="flex-1">
                        <input
                          id="replace-width-input"
                          type="number"
                          min="20"
                          max="1000"
                          step="1"
                          value={Math.round(selectedTextBlock.width ?? 100)}
                          oninput={(e) => {
                            const val = parseFloat(e.target.value);
                            if (Number.isFinite(val)) {
                              onupdatetextblockdimensions?.({ width: Math.max(20, val) });
                            }
                          }}
                          class="w-full h-8 px-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title="Width"
                        />
                        <span class="text-xs text-gray-400">W</span>
                      </div>
                      <span class="text-gray-400">×</span>
                      <div class="flex-1">
                        <input
                          id="replace-height-input"
                          type="number"
                          min="10"
                          max="1000"
                          step="1"
                          value={Math.round(selectedTextBlock.height ?? 20)}
                          oninput={(e) => {
                            const val = parseFloat(e.target.value);
                            if (Number.isFinite(val)) {
                              onupdatetextblockdimensions?.({ height: Math.max(10, val) });
                            }
                          }}
                          class="w-full h-8 px-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title="Height"
                        />
                        <span class="text-xs text-gray-400">H</span>
                      </div>
                    </div>
                  </div>
                </div>
              {:else}
                <div class="text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-md p-3">
                  Click a text block on the page to adjust its font or size.
                </div>
              {/if}
            </div>

            <!-- Debug Overlay Toggle -->
            <div class="space-y-1">
              <label class="flex items-center justify-between cursor-pointer">
                <span class="text-sm text-gray-600">Debug Overlay</span>
                <button
                  title="Debug"
                  onclick={() => ontoggledebugoverlayupdate?.()}
                  class="relative w-10 h-6 rounded-full transition-colors {debugOverlay
                    ? 'bg-blue-500'
                    : 'bg-gray-300'}"
                >
                  <span
                    class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform {debugOverlay
                      ? 'translate-x-4'
                      : ''}"
                  ></span>
                </button>
              </label>
              <p class="text-xs text-gray-400">Show detected text bounds (press D)</p>
            </div>

            <!-- Exit Button -->
            <button
              onclick={ontoggleeditmode}
              class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Exit Replace Text Mode (press E)
            </button>
          </div>
          <!-- Selected Object Properties (only in normal mode) -->
        {:else if selectedObject}
          {#if selectedObject.type === 'text'}
            <TextProperties
              object={selectedObject}
              {fontFamilies}
              onupdate={(detail) => onupdateobject?.(selectedObject.id, detail)}
              ondelete={() => ondeleteobject?.(selectedObject.id)}
              {onselectfont}
            />
          {:else if selectedObject.type === 'image'}
            <ImageProperties
              object={selectedObject}
              onupdate={(detail) => onupdateobject?.(selectedObject.id, detail)}
              ondelete={() => ondeleteobject?.(selectedObject.id)}
            />
          {:else if selectedObject.type === 'drawing'}
            <DrawingProperties
              object={selectedObject}
              onupdate={(detail) => onupdateobject?.(selectedObject.id, detail)}
              ondelete={() => ondeleteobject?.(selectedObject.id)}
            />
          {/if}
        {:else}
          <div class="text-sm text-gray-400 text-center py-4">Select an annotation to edit its properties</div>
        {/if}

        <!-- Divider -->
        <div class="border-t border-gray-200 my-2"></div>

        <!-- Tools Section -->
        <div class="space-y-5">
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Tools</div>

          <!-- Default Font for New Text -->
          <div class="space-y-1">
            <label class="text-sm text-gray-600" for="default-font-select">Default Font</label>
            <select
              id="default-font-select"
              value={currentFont}
              onchange={handleFontPresetChange}
              class="w-full h-8 px-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {#each fontFamilies as family}
                <option value={family}>
                  {family}{customFontNames.includes(family) ? ' ★' : ''}
                </option>
              {/each}
            </select>
            <p class="text-xs text-gray-400">Used when adding new text</p>
          </div>

          <!-- Import Custom Font -->
          <div class="space-y-1">
            <input
              bind:this={fontInputRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              onchange={handleFontFileChange}
              class="hidden"
            />
            <button
              onclick={triggerFontImport}
              disabled={importing}
              class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {#if importing}
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Importing...
              {:else}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Import Font
              {/if}
            </button>
            <p class="text-xs text-gray-400">Add .ttf or .otf font files</p>
          </div>

          <!-- Replace Text Mode Toggle (only show when not in edit mode) -->
          {#if !editMode}
            <div class="space-y-1">
              <button
                onclick={ontoggleeditmode}
                disabled={textExtractionInProgress}
                class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                  Extracting...
                {:else}
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Replace Text Mode
                {/if}
              </button>
              <p class="text-xs text-gray-400">Edit existing text in the PDF (press E)</p>
            </div>
          {/if}
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-200 my-2"></div>

        <!-- System Section -->
        <div class="space-y-5">
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">System</div>

          <!-- Clear Cache -->
          <div class="space-y-1">
            <button
              onclick={handleClearCache}
              disabled={clearing}
              class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
            >
              {#if clearing}
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Clearing...
              {:else}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Clear All Cache
              {/if}
            </button>
            <p class="text-xs text-gray-400">Remove custom fonts, recent files, and settings</p>
          </div>
        </div>
      </div>
    {/if}
  </aside>
{/if}
