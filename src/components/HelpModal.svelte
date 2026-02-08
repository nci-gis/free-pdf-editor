<script>
  import { fade, scale } from 'svelte/transition';

  let { show = $bindable(false) } = $props();

  function handleDismiss() {
    show = false;
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      handleDismiss();
    }
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    transition:fade={{ duration: 150 }}
    onclick={handleDismiss}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="help-title"
    tabindex="-1"
  >
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="bg-white rounded-xl shadow-2xl w-full mx-4 overflow-hidden flex flex-col"
      style="max-width: 80vw; max-height: 80vh; min-width: 320px; min-height: 400px;"
      transition:scale={{ duration: 200, start: 0.95 }}
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="document"
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <h2 id="help-title" class="text-xl font-semibold text-white flex items-center gap-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Help & Guide
        </h2>
        <button
          onclick={handleDismiss}
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white"
          aria-label="Close"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        <!-- Getting Started -->
        <section>
          <h3 class="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2 mb-3">
            <span class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            Getting Started
          </h3>
          <ul class="space-y-2 text-sm text-gray-600 ml-8">
            <li>Click <strong>Open PDF</strong> or drag & drop a file anywhere to load a PDF.</li>
            <li>Recent files appear below the button for quick access.</li>
            <li>Use the toolbar icons to add text, images, or drawings.</li>
          </ul>
        </section>

        <!-- Annotations -->
        <section>
          <h3 class="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2 mb-3">
            <span class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </span>
            Annotations
          </h3>
          <ul class="space-y-2 text-sm text-gray-600 ml-8">
            <li><strong>Text</strong> &mdash; Click the text icon, then click on a page to place it.</li>
            <li><strong>Image</strong> &mdash; Click the image icon and select a file (JPG/PNG).</li>
            <li><strong>Drawing</strong> &mdash; Click the pencil icon and draw directly on the page.</li>
            <li>Click and drag any element to move it. Drag corner handles to resize.</li>
            <li>Hold <kbd class="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Shift</kbd> while resizing to maintain aspect ratio.</li>
          </ul>
        </section>

        <!-- Replace Text Mode -->
        <section>
          <h3 class="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2 mb-3">
            <span class="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </span>
            Replace Text Mode
          </h3>
          <ul class="space-y-2 text-sm text-gray-600 ml-8">
            <li>Press <kbd class="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">E</kbd> or click "Replace Text" in the sidebar to enter edit mode.</li>
            <li>Click a text block to select it, double-click to start editing.</li>
            <li>Use the sidebar to change font, size, and dimensions.</li>
            <li>Drag text blocks to reposition. Use edge/corner handles to resize.</li>
            <li>Click outside or press <kbd class="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Escape</kbd> to finish editing.</li>
          </ul>
        </section>

        <!-- Fonts & Unicode -->
        <section>
          <h3 class="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2 mb-3">
            <span class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </span>
            Fonts & Unicode
          </h3>
          <ul class="space-y-2 text-sm text-gray-600 ml-8">
            <li>Built-in fonts (Helvetica, Courier, Times-Roman) support <strong>Latin characters only</strong>.</li>
            <li>For <strong>Unicode</strong> text, use fonts with .ttf files (Arial, Roboto, Open Sans, etc.).</li>
            <li>Import your own .ttf/.otf fonts via <strong>Import Font</strong> in the sidebar.</li>
            <li>Custom fonts are saved locally and persist across sessions.</li>
          </ul>
          <div class="ml-8 mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md text-sm text-gray-600">
            <p class="font-medium text-purple-700 mb-1">How to identify fonts in your PDF</p>
            <p>To find the exact fonts used in a PDF, open it in Adobe Acrobat and go to
              <strong>Menu &gt; Document Properties &gt; Fonts</strong> (Windows) or
              <strong>File &gt; Document Properties &gt; Fonts</strong> (macOS).<br />
              The Fonts tab lists all typefaces used in the document. Pay attention to exact spelling, capitalization, and hyphens
              &mdash; then select or import the matching font here for best results.
            </p>
            <a
              href="https://helpx.adobe.com/acrobat/desktop/create-documents/explore-advanced-conversion-settings/find-ps-fonts.html"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-block mt-1 text-xs text-purple-600 hover:text-purple-800 underline"
            >Learn more (Adobe Acrobat Help)</a>
          </div>
        </section>

        <!-- Keyboard Shortcuts -->
        <section>
          <h3 class="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2 mb-3">
            <span class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
              </svg>
            </span>
            Keyboard Shortcuts
          </h3>
          <div class="ml-8 text-sm">
            <table class="w-full">
              <tbody class="divide-y divide-gray-100">
                <tr>
                  <td class="py-1.5 pr-4"><kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+S</kbd></td>
                  <td class="py-1.5 text-gray-600">Save / Export PDF</td>
                </tr>
                <tr>
                  <td class="py-1.5 pr-4"><kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">E</kbd></td>
                  <td class="py-1.5 text-gray-600">Toggle Replace Text mode</td>
                </tr>
                <tr>
                  <td class="py-1.5 pr-4"><kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">D</kbd></td>
                  <td class="py-1.5 text-gray-600">Toggle debug overlay (edit mode)</td>
                </tr>
                <tr>
                  <td class="py-1.5 pr-4"><kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">F1</kbd></td>
                  <td class="py-1.5 text-gray-600">Toggle Tips popup</td>
                </tr>
                <tr>
                  <td class="py-1.5 pr-4"><kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Escape</kbd></td>
                  <td class="py-1.5 text-gray-600">Cancel editing / Deselect</td>
                </tr>
                <tr>
                  <td class="py-1.5 pr-4"><kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+Shift+R</kbd></td>
                  <td class="py-1.5 text-gray-600">Hard refresh (clear cache)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Privacy -->
        <section>
          <h3 class="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2 mb-3">
            <span class="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            Privacy & Offline
          </h3>
          <ul class="space-y-2 text-sm text-gray-600 ml-8">
            <li>All editing happens <strong>entirely in your browser</strong>.</li>
            <li>No files are uploaded. No data leaves your device.</li>
            <li>Works fully offline after first load.</li>
          </ul>
        </section>

      </div>

      <!-- Footer -->
      <div class="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
        <button
          onclick={handleDismiss}
          class="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg
                 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
