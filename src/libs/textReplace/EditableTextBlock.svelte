<script>
  import { mapToAvailableFont } from './textExtractor.js';
  import { Fonts, fetchFont } from '@src/utils/prepareAssets.js';

  let { block, isEdited = false, onselect, onchange } = $props();

  let isSelected = $state(false);
  let isEditing = $state(false);
  let editableEl = $state();
  let currentText = $state(block.text);
  let selectedFont = $state(mapToAvailableFont(block.fontName));
  let selectedFontSize = $state(block.fontSize); // Start with auto-detected size
  let fontSizeAuto = $state(true); // Track if using auto size
  const fontOptions = Object.keys(Fonts);

  // Map font to available fonts
  let mappedFont = $derived(mapToAvailableFont(block.fontName));

  // Estimate if text might be clipped (rough approximation)
  let estimatedTextWidth = $derived(currentText.length * selectedFontSize * 0.6);
  let mayBeClipped = $derived(estimatedTextWidth > block.width * 1.1);

  function handleClick(e) {
    e.stopPropagation();
    if (!isSelected) {
      isSelected = true;
      onselect?.({ id: block.id });
    } else if (!isEditing) {
      startEditing();
    }
  }

  function handleDoubleClick(e) {
    e.stopPropagation();
    if (!isEditing) {
      isSelected = true;
      startEditing();
    }
  }

  function startEditing() {
    isEditing = true;
    // Focus after DOM update
    setTimeout(() => {
      if (editableEl) {
        editableEl.focus();
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(editableEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 0);
  }

  function handleBlur() {
    finishEditing();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      // Cancel editing, revert to original
      currentText = block.text;
      selectedFont = mappedFont;
      selectedFontSize = block.fontSize;
      fontSizeAuto = true;
      if (editableEl) {
        editableEl.textContent = block.text;
      }
      isEditing = false;
      isSelected = false;
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      finishEditing();
    }
  }

  function finishEditing() {
    if (!isEditing) return;

    const newText = editableEl?.textContent || '';
    isEditing = false;

    const textChanged = newText !== block.text;
    const fontChanged = selectedFont !== mappedFont;
    const fontSizeChanged = !fontSizeAuto || selectedFontSize !== block.fontSize;

    if (textChanged || fontChanged || fontSizeChanged) {
      currentText = newText;
      onchange?.({
        id: block.id,
        originalText: block.text,
        newText: newText,
        bounds: {
          x: block.x,
          y: block.y,
          width: block.width,
          height: block.height,
        },
        fontSize: selectedFontSize,
        fontName: selectedFont,
      });
    }
  }

  export function deselect() {
    if (isEditing) {
      finishEditing();
    }
    isSelected = false;
  }

  function handleFontChange(event) {
    selectedFont = event.target.value;
    fetchFont(selectedFont);

    if (editableEl) {
      editableEl.style.fontFamily = `'${selectedFont}', sans-serif`;
    }

    // Allow font-only changes without entering edit mode
    if (!isEditing && selectedFont !== mappedFont) {
      onchange?.({
        id: block.id,
        originalText: block.text,
        newText: currentText,
        bounds: {
          x: block.x,
          y: block.y,
          width: block.width,
          height: block.height,
        },
        fontSize: selectedFontSize,
        fontName: selectedFont,
      });
    }
  }

  function handleFontSizeChange(event) {
    const value = event.target.value;
    if (value === 'auto') {
      fontSizeAuto = true;
      selectedFontSize = block.fontSize;
    } else {
      fontSizeAuto = false;
      selectedFontSize = Math.max(6, Math.min(72, parseInt(value) || block.fontSize));
    }

    // Allow size-only changes without entering edit mode
    if (!isEditing) {
      onchange?.({
        id: block.id,
        originalText: block.text,
        newText: currentText,
        bounds: {
          x: block.x,
          y: block.y,
          width: block.width,
          height: block.height,
        },
        fontSize: selectedFontSize,
        fontName: selectedFont,
      });
    }
  }
</script>

<div
  class="absolute cursor-pointer transition-all duration-150"
  style="
    left: {block.x}px;
    top: {block.y}px;
    min-width: {block.width}px;
    min-height: {block.height}px;
    font-size: {selectedFontSize}px;
    font-family: {selectedFont}, sans-serif;
    line-height: 1.2;
  "
  class:ring-2={isSelected}
  class:ring-blue-500={isSelected && !isEdited}
  class:ring-amber-500={isSelected && isEdited}
  class:bg-blue-50={isSelected && !isEditing && !isEdited}
  class:bg-amber-50={isEdited && !isEditing}
  class:bg-white={isEditing}
  class:shadow-md={isEditing}
  class:z-10={isSelected}
  onclick={handleClick}
  ondblclick={handleDoubleClick}
  onkeydown={handleKeydown}
  role="button"
  tabindex="0"
>
  {#if isSelected || isEditing}
    <div class="absolute -top-7 right-0 flex items-center gap-1 z-20">
      <label class="text-[10px] text-gray-600" for="font-select-{block.id}">Font</label>
      <select
        id="font-select-{block.id}"
        class="h-6 text-xs border border-gray-300 rounded px-1 bg-white shadow-sm"
        bind:value={selectedFont}
        onchange={handleFontChange}
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        {#each fontOptions as font (font)}
          <option value={font}>{font}</option>
        {/each}
      </select>
      <label class="text-[10px] text-gray-600 ml-1" for="size-select-{block.id}">Size</label>
      <select
        id="size-select-{block.id}"
        class="h-6 w-16 text-xs border border-gray-300 rounded px-1 bg-white shadow-sm"
        value={fontSizeAuto ? 'auto' : selectedFontSize}
        onchange={handleFontSizeChange}
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        <option value="auto">Auto ({Math.round(block.fontSize)})</option>
        {#each [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48] as size}
          <option value={size}>{size}</option>
        {/each}
      </select>
    </div>
  {/if}
  {#if isEditing}
    <div
      bind:this={editableEl}
      contenteditable="true"
      class="outline-none px-1 whitespace-pre-wrap"
      onblur={handleBlur}
      onkeydown={handleKeydown}
      role="textbox"
      tabindex="0"
    >
      {currentText}
    </div>
  {:else}
    <div class="px-1 whitespace-pre-wrap" class:opacity-70={!isSelected && !isEdited}>
      {currentText}
      {#if isEdited}
        <span class="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-1 rounded" style="font-size: 10px;">
          edited
        </span>
      {/if}
      {#if mayBeClipped && (isEdited || isSelected)}
        <span
          class="absolute -bottom-2 -right-2 bg-orange-500 text-white text-xs px-1 rounded cursor-help"
          style="font-size: 10px;"
          title="Text may be clipped in exported PDF"
        >
          ⚠️
        </span>
      {/if}
    </div>
  {/if}
</div>
