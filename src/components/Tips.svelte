<script>
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { tapout } from '@src/utils/tapout.js';
  import { tips, TIPS_STORAGE_KEY } from '@src/config/tips.js';

  let isOpen = false;
  let isDragging = false;
  let hasMoved = false;
  let buttonEl;

  // Position state (null means use default bottom-right)
  let position = { x: null, y: null };

  // Drag state
  let dragStart = { x: 0, y: 0 };
  let initialPos = { x: 0, y: 0 };

  const BUTTON_SIZE = 48;
  const MARGIN = 24;

  onMount(() => {
    // Load saved position from localStorage
    try {
      const saved = localStorage.getItem(TIPS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.x !== null && parsed.y !== null) {
          position = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load tips position:', e);
    }
  });

  function savePosition() {
    try {
      localStorage.setItem(TIPS_STORAGE_KEY, JSON.stringify(position));
    } catch (e) {
      console.warn('Failed to save tips position:', e);
    }
  }

  function getConstrainedPosition(x, y) {
    const maxX = window.innerWidth - BUTTON_SIZE - MARGIN;
    const maxY = window.innerHeight - BUTTON_SIZE - MARGIN;
    return {
      x: Math.max(MARGIN, Math.min(x, maxX)),
      y: Math.max(MARGIN, Math.min(y, maxY)),
    };
  }

  function handlePointerDown(e) {
    if (e.button !== 0) return; // Only left click

    isDragging = true;
    hasMoved = false;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragStart = { x: clientX, y: clientY };

    // Get current position
    if (position.x !== null && position.y !== null) {
      initialPos = { x: position.x, y: position.y };
    } else {
      // Calculate default position (bottom-right)
      initialPos = {
        x: window.innerWidth - BUTTON_SIZE - MARGIN,
        y: window.innerHeight - BUTTON_SIZE - MARGIN,
      };
    }

    e.preventDefault();
  }

  function handlePointerMove(e) {
    if (!isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;

    // Only consider it moved if dragged more than 5px
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMoved = true;
    }

    const newPos = getConstrainedPosition(initialPos.x + dx, initialPos.y + dy);
    position = newPos;
  }

  function handlePointerUp() {
    if (isDragging && hasMoved) {
      savePosition();
    }
    isDragging = false;
  }

  function handleClick() {
    // Only toggle if we didn't drag
    if (!hasMoved) {
      isOpen = !isOpen;
    }
    hasMoved = false;
  }

  function close() {
    isOpen = false;
  }

  function resetPosition() {
    position = { x: null, y: null };
    localStorage.removeItem(TIPS_STORAGE_KEY);
    close();
  }

  // Compute button style
  $: buttonStyle =
    position.x !== null && position.y !== null
      ? `left: ${position.x}px; top: ${position.y}px;`
      : `bottom: ${MARGIN}px; right: ${MARGIN}px;`;

  // Compute popup position relative to button
  $: popupStyle =
    position.x !== null && position.y !== null
      ? computePopupPosition(position.x, position.y)
      : `bottom: ${MARGIN + BUTTON_SIZE + 12}px; right: ${MARGIN}px;`;

  function computePopupPosition(bx, by) {
    const popupWidth = 320;
    const popupHeight = 400; // approximate

    // Determine if popup should go left or right of button
    let left = bx;
    if (bx + popupWidth > window.innerWidth - MARGIN) {
      left = bx - popupWidth + BUTTON_SIZE;
    }
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - popupWidth - MARGIN));

    // Determine if popup should go above or below button
    let top = by - popupHeight - 12;
    if (top < MARGIN) {
      top = by + BUTTON_SIZE + 12;
    }

    return `left: ${left}px; top: ${top}px;`;
  }
</script>

<svelte:window
  on:mousemove={handlePointerMove}
  on:mouseup={handlePointerUp}
  on:touchmove={handlePointerMove}
  on:touchend={handlePointerUp}
/>

<!-- Floating Tips Button -->
<div bind:this={buttonEl} class="fixed z-40" style={buttonStyle}>
  <button
    on:mousedown={handlePointerDown}
    on:touchstart={handlePointerDown}
    on:click={handleClick}
    class="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700
    text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center
    {isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab'}"
    title="Quick Tips (drag to move)"
    aria-label="Show tips"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  </button>
</div>

<!-- Tips Popup -->
{#if isOpen}
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 bg-black/30"
    on:click={close}
    on:keydown={(e) => e.key === 'Escape' && close()}
    role="button"
    tabindex="-1"
    aria-label="Close tips"
  ></div>

  <div
    use:tapout
    on:tapout={close}
    transition:fly={{ y: 20, duration: 200 }}
    class="fixed z-50 bg-white rounded-xl shadow-2xl overflow-hidden"
    style="{popupStyle} width: 320px; max-height: calc(100vh - 8rem);"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 bg-amber-500 text-white">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <span class="font-semibold">Quick Tips</span>
      </div>
      <button
        on:click={close}
        class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Tips List -->
    <div class="overflow-y-auto" style="max-height: calc(100vh - 14rem);">
      {#each tips as tip, index}
        <div class="flex items-start gap-3 px-4 py-3 {index < tips.length - 1 ? 'border-b border-gray-100' : ''}">
          <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {@html tip.icon}
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-medium text-gray-900">{tip.title}</h4>
            <p class="text-xs text-gray-500 mt-0.5">{tip.description}</p>
          </div>
        </div>
      {/each}
    </div>

    <!-- Footer -->
    <div class="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
      <p class="text-xs text-gray-400">All edits happen in your browser</p>
      {#if position.x !== null}
        <button
          on:click={resetPosition}
          class="text-xs text-gray-400 hover:text-gray-600 underline"
          title="Reset button to default position"
        >
          Reset position
        </button>
      {/if}
    </div>
  </div>
{/if}
