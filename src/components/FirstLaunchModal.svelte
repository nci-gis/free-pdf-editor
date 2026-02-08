<script>
  import { fade, scale } from 'svelte/transition';

  let { show = $bindable(false) } = $props();

  const STORAGE_KEY = 'app_welcomeSeen';

  // Check if user has seen the welcome message before
  function hasSeenWelcome() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  function markAsSeen() {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
  }

  // Just close without marking as seen (for clicking outside / Escape)
  function handleDismiss() {
    show = false;
  }

  // Close AND mark as seen (only for "Got it!" button)
  function handleConfirm() {
    markAsSeen();
    show = false;
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      handleDismiss();
    } else if (e.key === 'Enter') {
      handleConfirm();
    }
  }
</script>

{#if show && !hasSeenWelcome()}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    transition:fade={{ duration: 150 }}
    onclick={handleDismiss}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="welcome-title"
    tabindex="-1"
  >
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="bg-white rounded-xl shadow-2xl max-w-md mx-4 overflow-hidden"
      transition:scale={{ duration: 200, start: 0.95 }}
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="document"
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <h2 id="welcome-title" class="text-xl font-semibold text-white flex items-center gap-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Welcome to Free PDF Editor
        </h2>
      </div>

      <!-- Content -->
      <div class="px-6 py-5 space-y-4">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">
            <strong>100% Private & Offline.</strong><br />
            All editing happens in your browser. No uploads, no tracking, no data leaves your device.
          </p>
        </div>

        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">
            <strong>Add annotations, images, drawings.</strong><br />
            Use the toolbar to add text, insert images, or draw directly on your PDFs.
          </p>
        </div>

        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">
            <strong>Replace text mode.</strong><br />
            Press <kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">E</kbd>
            or click "Replace Text" to edit existing text in simple PDFs.
          </p>
        </div>

        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">
            Press <kbd class="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">F1</kbd>
            anytime to see helpful tips, or click the <strong>Tips</strong> button in the bottom-right corner.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-gray-50 flex justify-between items-center">
        <span class="text-xs text-gray-500"> This message shows once </span>
        <button
          onclick={handleConfirm}
          class="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg
                 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Got it!
        </button>
      </div>
    </div>
  </div>
{/if}
