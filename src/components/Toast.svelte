<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  let { message = '', type = 'success', duration = 3000, onClose = () => {} } = $props();

  let visible = $state(true);

  onMount(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        visible = false;
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  });

  function handleClose() {
    visible = false;
    setTimeout(onClose, 300);
  }

  const icons = {
    success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
    </svg>`,
    error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
    </svg>`,
    info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>`,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
  };
</script>

{#if visible}
  <div
    transition:fly={{ y: -50, duration: 300 }}
    class="fixed z-50 flex items-center px-4 py-3 rounded-lg border shadow-lg {colors[type]}"
    style="top: 4rem; right: 1rem;"
  >
    <span class="mr-3 {iconColors[type]}">
      {@html icons[type]}
    </span>
    <span class="font-medium mr-2">{message}</span>
    <button
      onclick={handleClose}
      class="ml-2 opacity-60 hover:opacity-100 transition-opacity"
      aria-label="Close notification"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
{/if}
