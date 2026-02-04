<script>
  import DeleteIcon from '@src/assets/icons/DeleteIcon.svelte';

  let { object, onupdate, ondelete } = $props();

  let scale = $state(Math.round((object?.scale ?? 1) * 100));
  let x = $state(Math.round(object?.x ?? 0));
  let y = $state(Math.round(object?.y ?? 0));

  // Sync state when object changes
  $effect(() => {
    if (object) {
      scale = Math.round((object.scale ?? 1) * 100);
      x = Math.round(object.x ?? 0);
      y = Math.round(object.y ?? 0);
    }
  });

  function handleScaleChange() {
    const newScale = scale / 100;
    const newWidth = (object?.originWidth ?? 100) * newScale;
    onupdate?.({ scale: newScale, width: newWidth });
  }

  function handlePositionChange() {
    onupdate?.({ x, y });
  }

  function handleDelete() {
    ondelete?.();
  }
</script>

<div class="space-y-4">
  <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Drawing Properties</div>

  <!-- Scale -->
  <div class="space-y-2">
    <label class="text-sm text-gray-600" for="scale-input">Scale</label>
    <div class="flex items-center gap-2">
      <input
        id="scale-input"
        type="range"
        min="10"
        max="200"
        step="5"
        bind:value={scale}
        oninput={handleScaleChange}
        class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div class="flex items-center gap-1">
        <input
          type="number"
          min="10"
          max="200"
          step="5"
          bind:value={scale}
          onchange={handleScaleChange}
          class="w-14 h-8 px-2 text-sm text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span class="text-xs text-gray-400">%</span>
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
    Delete Drawing
  </button>
</div>
