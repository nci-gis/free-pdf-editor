<script>
  import DeleteIcon from '@src/assets/icons/DeleteIcon.svelte';
  import LineHeightIcon from '@src/assets/icons/LineHeightIcon.svelte';
  import TextFamilyIcon from '@src/assets/icons/TextFamilyIcon.svelte';
  import TextIcon from '@src/assets/icons/TextIcon.svelte';

  let { object, onupdate, ondelete, onselectfont, fontFamilies = [] } = $props();

  let size = $state(object?.size ?? 16);
  let lineHeight = $state(object?.lineHeight ?? 1.4);
  let fontFamily = $state(object?.fontFamily ?? 'Times-Roman');
  let x = $state(Math.round(object?.x ?? 0));
  let y = $state(Math.round(object?.y ?? 0));

  // Sync state when object changes
  $effect(() => {
    if (object) {
      size = object.size ?? 16;
      lineHeight = object.lineHeight ?? 1.4;
      fontFamily = object.fontFamily ?? 'Times-Roman';
      x = Math.round(object.x ?? 0);
      y = Math.round(object.y ?? 0);
    }
  });

  function handleSizeChange() {
    onupdate?.({ size });
  }

  function handleLineHeightChange() {
    onupdate?.({ lineHeight });
  }

  function handleFontChange() {
    onselectfont?.({ name: fontFamily });
    onupdate?.({ fontFamily });
  }

  function handlePositionChange() {
    onupdate?.({ x, y });
  }

  function handleDelete() {
    ondelete?.();
  }
</script>

<div class="space-y-4">
  <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Text Properties</div>

  <!-- Font Family -->
  <div class="space-y-1">
    <label class="flex items-center gap-2 text-sm text-gray-600">
      <TextFamilyIcon class="w-4 h-4" />
      Font
    </label>
    <select
      bind:value={fontFamily}
      onchange={handleFontChange}
      class="w-full h-8 px-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {#each fontFamilies as family}
        <option value={family}>{family}</option>
      {/each}
    </select>
  </div>

  <!-- Font Size -->
  <div class="space-y-1">
    <label class="flex items-center gap-2 text-sm text-gray-600">
      <TextIcon class="w-4 h-4" />
      Size
    </label>
    <div class="flex items-center gap-2">
      <input
        type="number"
        min="8"
        max="120"
        step="0.5"
        bind:value={size}
        onchange={handleSizeChange}
        class="flex-1 h-8 px-2 text-sm text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span class="text-xs text-gray-400">px</span>
    </div>
  </div>

  <!-- Line Height -->
  <div class="space-y-1">
    <label class="flex items-center gap-2 text-sm text-gray-600">
      <LineHeightIcon class="w-4 h-4" />
      Line Height
    </label>
    <input
      type="number"
      min="1"
      max="3"
      step="0.1"
      bind:value={lineHeight}
      onchange={handleLineHeightChange}
      class="w-full h-8 px-2 text-sm text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <!-- Position -->
  <div class="space-y-2">
    <span class="text-sm text-gray-600">Position</span>
    <div class="grid grid-cols-2 gap-2">
      <div class="space-y-1">
        <label class="text-xs text-gray-400" for="text-x-input">X</label>
        <div class="flex items-center gap-1">
          <input
            id="text-x-input"
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
        <label class="text-xs text-gray-400" for="text-y-input">Y</label>
        <div class="flex items-center gap-1">
          <input
            id="text-y-input"
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
    Delete Text
  </button>
</div>
