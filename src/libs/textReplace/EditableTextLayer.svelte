<script>
  import EditableTextBlock from './EditableTextBlock.svelte';

  let {
    textLines = [],
    editedItems = new Map(),
    showDebugOverlay = false,
    pageScale = 1,
    ontextchange,
    onblockselect,
  } = $props();

  let selectedBlockId = null;
  let blockRefs = {};

  function handleBlockSelect(detail) {
    const { id } = detail;

    // Deselect previous block
    if (selectedBlockId && selectedBlockId !== id && blockRefs[selectedBlockId]) {
      blockRefs[selectedBlockId].deselect();
    }

    selectedBlockId = id;
    onblockselect?.(detail);
  }

  function handleBlockChange(detail) {
    ontextchange?.(detail);
  }

  function handleClickOutside() {
    if (selectedBlockId && blockRefs[selectedBlockId]) {
      blockRefs[selectedBlockId].deselect();
      selectedBlockId = null;
      onblockselect?.(null);
    }
  }

  function isBlockEdited(blockId) {
    return editedItems.has(blockId);
  }

  export function applyFontAndSizeToBlock(blockId, payload) {
    blockRefs[blockId]?.applyFontAndSize(payload);
  }

  export function applyDimensionsToBlock(blockId, payload) {
    blockRefs[blockId]?.applyDimensions(payload);
  }

  // Padding (in px) around each text box to fully cover original glyphs underneath
  const MASK_PADDING = 3;
</script>

<div
  class="absolute inset-0"
  style="transform-origin: top left;"
  onclick={handleClickOutside}
  onkeydown={(e) => e.key === 'Escape' && handleClickOutside()}
  role="button"
  tabindex="-1"
>
  {#if textLines.length === 0}
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="bg-gray-800/80 text-white px-4 py-2 rounded-lg text-sm">No replaceable text found on this page</div>
    </div>
  {:else}
    <!-- Mask the original rendered text so edited text doesn't overlap visually -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      {#each textLines as line (line.id)}
        <div
          class="absolute bg-white"
          style="
            left: {line.x - MASK_PADDING}px;
            top: {line.y - MASK_PADDING}px;
            width: {line.width + MASK_PADDING * 2}px;
            height: {line.height + MASK_PADDING * 2}px;
          "
        ></div>
      {/each}
    </div>

    {#each textLines as line (line.id)}
      <EditableTextBlock
        bind:this={blockRefs[line.id]}
        block={line}
        {pageScale}
        isEdited={isBlockEdited(line.id)}
        onselect={handleBlockSelect}
        onchange={handleBlockChange}
      />
    {/each}

    <!-- Debug overlay: show detected text block bounds -->
    {#if showDebugOverlay}
      <div class="absolute inset-0 pointer-events-none z-50" aria-hidden="true">
        {#each textLines as line, i (line.id)}
          <div
            class="absolute border-2 border-red-500 bg-red-200/30"
            style="
              left: {line.x}px;
              top: {line.y}px;
              width: {line.width}px;
              height: {line.height}px;
            "
          >
            <span class="absolute -top-4 left-0 text-[8px] text-red-600 bg-white px-0.5 rounded whitespace-nowrap">
              {i}: {line.width.toFixed(0)}×{line.height.toFixed(0)} @{line.fontSize.toFixed(1)}px
            </span>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  @reference 'tailwindcss';
</style>
