<script>
  import DeleteIcon from '@src/assets/icons/DeleteIcon.svelte';

  let { object, onupdate, ondelete } = $props();

  let width = $state(Math.round(object?.width ?? 100));
  let height = $state(Math.round(object?.height ?? 100));
  let x = $state(Math.round(object?.x ?? 0));
  let y = $state(Math.round(object?.y ?? 0));
  let lockAspectRatio = $state(true);
  let aspectRatio = $state((object?.width ?? 100) / (object?.height ?? 100));

  // Sync state when object changes
  $effect(() => {
    if (object) {
      width = Math.round(object.width ?? 100);
      height = Math.round(object.height ?? 100);
      x = Math.round(object.x ?? 0);
      y = Math.round(object.y ?? 0);
      aspectRatio = (object.width ?? 100) / (object.height ?? 100);
    }
  });

  function handleWidthChange() {
    if (lockAspectRatio) {
      height = Math.round(width / aspectRatio);
      onupdate?.({ width, height });
    } else {
      onupdate?.({ width });
    }
  }

  function handleHeightChange() {
    if (lockAspectRatio) {
      width = Math.round(height * aspectRatio);
      onupdate?.({ width, height });
    } else {
      onupdate?.({ height });
    }
  }

  function handlePositionChange() {
    onupdate?.({ x, y });
  }

  function handleDelete() {
    ondelete?.();
  }
</script>

<div class="space-y-4">
  <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Image Properties</div>

  <!-- Dimensions -->
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-sm text-gray-600">Dimensions</span>
      <label class="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
        <input type="checkbox" bind:checked={lockAspectRatio} class="w-3 h-3" />
        Lock ratio
      </label>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <div class="space-y-1">
        <label class="text-xs text-gray-400" for="width-input">Width</label>
        <div class="flex items-center gap-1">
          <input
            id="width-input"
            type="number"
            min="10"
            step="1"
            bind:value={width}
            onchange={handleWidthChange}
            class="w-full h-8 px-2 text-sm text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="text-xs text-gray-400">px</span>
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-xs text-gray-400" for="height-input">Height</label>
        <div class="flex items-center gap-1">
          <input
            id="height-input"
            type="number"
            min="10"
            step="1"
            bind:value={height}
            onchange={handleHeightChange}
            class="w-full h-8 px-2 text-sm text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="text-xs text-gray-400">px</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Position -->
  <div class="space-y-2">
    <span class="text-sm text-gray-600">Position</span>
    <div class="grid grid-cols-2 gap-2">
      <div class="space-y-1">
        <label class="text-xs text-gray-400" for="x-input">X</label>
        <div class="flex items-center gap-1">
          <input
            id="x-input"
            type="number"
            step="1"
            bind:value={x}
            onchange={handlePositionChange}
            class="w-full h-8 px-2 text-sm text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="text-xs text-gray-400">px</span>
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-xs text-gray-400" for="y-input">Y</label>
        <div class="flex items-center gap-1">
          <input
            id="y-input"
            type="number"
            step="1"
            bind:value={y}
            onchange={handlePositionChange}
            class="w-full h-8 px-2 text-sm text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="text-xs text-gray-400">px</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Button -->
  <button
    onclick={handleDelete}
    class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
  >
    <DeleteIcon class="w-4 h-4" />
    Delete Image
  </button>
</div>
