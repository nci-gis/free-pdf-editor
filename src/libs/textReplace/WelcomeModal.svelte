<script>
  import { fade, scale } from 'svelte/transition';

  let { show = false, onclose } = $props();

  const STORAGE_KEY = 'textReplace_welcomeSeen';

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
    onclose?.();
  }

  // Close AND mark as seen (only for "Got it!" button)
  function handleConfirm() {
    markAsSeen();
    onclose?.();
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
      <div class="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
        <h2 id="welcome-title" class="text-xl font-semibold text-white flex items-center gap-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Replace Text Mode
        </h2>
      </div>

      <!-- Content -->
      <div class="px-6 py-5 space-y-4">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">
            <strong>Works best on simple PDFs.</strong><br />
            Complex layouts may not be editable.
          </p>
        </div>

        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">
            Try different fonts from the dropdown, or upload your own fonts to
            <code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">public/assets/fonts</code>
          </p>
        </div>

        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">
            Click the <strong>Tips</strong> button (bottom-right) for more helpful tips on using this editor.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-gray-50 flex justify-end">
        <button
          onclick={handleConfirm}
          class="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg
                 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          Got it!
        </button>
      </div>
    </div>
  </div>
{/if}
