<script>
  import { pannable } from '@src/utils/pannable.js';
  import { fetchFont } from '@src/utils/prepareAssets.js';

  import { mapToAvailableFont } from './textExtractor.js';

  let { block, isEdited = false, pageScale = 1, onselect, onchange } = $props();

  let isSelected = $state(false);
  let isEditing = $state(false);
  let editableEl = $state();
  let currentText = $state(block.text);
  let selectedFont = $state(mapToAvailableFont(block.fontName));
  let selectedFontSize = $state(block.fontSize); // Start with auto-detected size
  let fontSizeAuto = $state(true); // Track if using auto size
  let offsetX = $state(0);
  let offsetY = $state(0);
  let panDX = $state(0);
  let panDY = $state(0);
  let isDragging = $state(false);

  // Resize state
  let widthDelta = $state(0);
  let heightDelta = $state(0);
  let isResizing = $state(false);
  let resizeStartX = 0;
  let resizeStartY = 0;
  let resizeHandle = ''; // 'se', 'e', 's' for southeast, east, south

  // Computed dimensions
  let currentWidth = $derived(block.width + widthDelta);
  let currentHeight = $derived(block.height + heightDelta);

  // Map font to available fonts
  let mappedFont = $derived(mapToAvailableFont(block.fontName));

  // Estimate if text might be clipped (rough approximation)
  let estimatedTextWidth = $derived(currentText.length * selectedFontSize * 0.6);
  let mayBeClipped = $derived(estimatedTextWidth > currentWidth * 1.1);

  function handleClick(e) {
    e.stopPropagation();
    isSelected = true;
    onselect?.({
      id: block.id,
      fontName: selectedFont,
      fontSize: selectedFontSize,
      fontSizeAuto: fontSizeAuto,
      x: block.x + offsetX,
      y: block.y + offsetY,
      width: currentWidth,
      height: currentHeight,
    });
    // Edit mode still requires double-click; single click is now selection + sidebar sync
  }

  let startX = 0;
  let startY = 0;

  function handlePanStart(event) {
    if (isResizing) return false; // Don't pan while resizing

    // Check if the target is a resize handle (has cursor-*-resize class)
    const target = event.detail.target;
    if (
      target?.classList?.contains('cursor-ew-resize') ||
      target?.classList?.contains('cursor-ns-resize') ||
      target?.classList?.contains('cursor-nwse-resize')
    ) {
      return false; // Don't pan when clicking resize handles
    }

    const { x, y } = event.detail;
    panDX = 0;
    panDY = 0;
    isDragging = true;
    // Select on drag start
    if (!isSelected) {
      onselect?.({
        id: block.id,
        fontName: selectedFont,
        fontSize: selectedFontSize,
        fontSizeAuto: fontSizeAuto,
        width: currentWidth,
        height: currentHeight,
      });
      isSelected = true;
    }
    // record starting point
    startX = x;
    startY = y;
  }

  function handlePanMove(event) {
    if (isResizing) return;
    const { x, y } = event.detail;
    panDX += (x - startX) / pageScale;
    panDY += (y - startY) / pageScale;
    startX = x;
    startY = y;
  }

  function handlePanEnd() {
    if (isResizing) {
      isDragging = false;
      return;
    }
    if (panDX === 0 && panDY === 0) {
      isDragging = false;
      return;
    }
    // Update offsets in page coordinates (no scale here; layer already scaled)
    offsetX += panDX;
    offsetY += panDY;

    onchange?.({
      id: block.id,
      originalText: block.text,
      newText: currentText,
      bounds: {
        x: block.x + offsetX,
        y: block.y + offsetY,
        width: currentWidth,
        height: currentHeight,
      },
      fontSize: selectedFontSize,
      fontName: selectedFont,
    });

    panDX = 0;
    panDY = 0;
    isDragging = false;
  }

  function handleDoubleClick(e) {
    e.stopPropagation();
    if (!isEditing) {
      handleClick(e);
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
          x: block.x + offsetX,
          y: block.y + offsetY,
          width: currentWidth,
          height: currentHeight,
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

  // Allow parent (sidebar) to drive font settings
  export function applyFontAndSize({ fontName, fontSize, fontSizeAuto: autoFlag } = {}) {
    if (fontName) {
      selectedFont = fontName;
      fetchFont(selectedFont);
      if (editableEl) {
        editableEl.style.fontFamily = `'${selectedFont}', sans-serif`;
      }
    }

    if (autoFlag !== undefined) {
      fontSizeAuto = autoFlag;
      selectedFontSize = autoFlag ? block.fontSize : selectedFontSize;
    }

    if (fontSize !== undefined && !autoFlag) {
      const clamped = Math.max(1, Math.min(64, Number(fontSize) || block.fontSize));
      selectedFontSize = clamped;
    }

    onchange?.({
      id: block.id,
      originalText: block.text,
      newText: currentText,
      bounds: {
        x: block.x + offsetX,
        y: block.y + offsetY,
        width: currentWidth,
        height: currentHeight,
      },
      fontSize: selectedFontSize,
      fontName: selectedFont,
    });
  }

  // Inline font/size handlers removed; changes now driven via sidebar controls.

  // Resize handlers
  function handleResizeStart(e, handle) {
    e.stopPropagation();
    e.preventDefault();
    isResizing = true;
    resizeHandle = handle;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  }

  function handleResizeMove(e) {
    if (!isResizing) return;

    const dx = (e.clientX - resizeStartX) / pageScale;
    const dy = (e.clientY - resizeStartY) / pageScale;

    if (resizeHandle.includes('e')) {
      widthDelta = Math.max(-block.width + 20, widthDelta + dx);
    }
    if (resizeHandle.includes('s')) {
      heightDelta = Math.max(-block.height + 10, heightDelta + dy);
    }

    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
  }

  function handleResizeEnd() {
    if (!isResizing) return;
    isResizing = false;

    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);

    // Emit change with new dimensions
    onchange?.({
      id: block.id,
      originalText: block.text,
      newText: currentText,
      bounds: {
        x: block.x + offsetX,
        y: block.y + offsetY,
        width: currentWidth,
        height: currentHeight,
      },
      fontSize: selectedFontSize,
      fontName: selectedFont,
    });

    // Notify parent of updated selection info
    onselect?.({
      id: block.id,
      fontName: selectedFont,
      fontSize: selectedFontSize,
      fontSizeAuto: fontSizeAuto,
      x: block.x + offsetX,
      y: block.y + offsetY,
      width: currentWidth,
      height: currentHeight,
    });
  }

  // Allow parent to set dimensions
  export function applyDimensions({ width, height } = {}) {
    if (width !== undefined) {
      widthDelta = Math.max(20, width) - block.width;
    }
    if (height !== undefined) {
      heightDelta = Math.max(10, height) - block.height;
    }

    onchange?.({
      id: block.id,
      originalText: block.text,
      newText: currentText,
      bounds: {
        x: block.x + offsetX,
        y: block.y + offsetY,
        width: currentWidth,
        height: currentHeight,
      },
      fontSize: selectedFontSize,
      fontName: selectedFont,
    });
  }
</script>

<div
  class="absolute transition-[background-color,box-shadow,opacity] duration-150"
  style="
    left: {block.x + offsetX + panDX}px;
    top: {block.y + offsetY + panDY}px;
    width: {currentWidth}px;
    min-height: {currentHeight}px;
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
  class:cursor-move={!isEditing && !isResizing}
  class:cursor-text={isEditing}
  onclick={handleClick}
  ondblclick={handleDoubleClick}
  onkeydown={handleKeydown}
  role="button"
  tabindex="0"
  use:pannable={{
    onpanstart: handlePanStart,
    onpanmove: handlePanMove,
    onpanend: handlePanEnd,
  }}
>
  {#if isSelected || isEditing}
    <!-- Context controls moved to sidebar; keep spacer for layout but no UI here -->
    <div class="absolute -top-7 right-0 h-6"></div>
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

  <!-- Resize handles (visible when selected) -->
  {#if isSelected && !isEditing}
    <!-- Right edge handle -->
    <div
      class="absolute top-1/2 -right-1 w-2 h-6 -translate-y-1/2 bg-blue-500 rounded cursor-ew-resize hover:bg-blue-600 transition-colors"
      onmousedown={(e) => handleResizeStart(e, 'e')}
      role="slider"
      aria-label="Resize width"
      tabindex="-1"
    ></div>
    <!-- Bottom edge handle -->
    <div
      class="absolute -bottom-1 left-1/2 w-6 h-2 -translate-x-1/2 bg-blue-500 rounded cursor-ns-resize hover:bg-blue-600 transition-colors"
      onmousedown={(e) => handleResizeStart(e, 's')}
      role="slider"
      aria-label="Resize height"
      tabindex="-1"
    ></div>
    <!-- Bottom-right corner handle -->
    <div
      class="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded cursor-nwse-resize hover:bg-blue-600 transition-colors"
      onmousedown={(e) => handleResizeStart(e, 'se')}
      role="slider"
      aria-label="Resize"
      tabindex="-1"
    ></div>
  {/if}
</div>
