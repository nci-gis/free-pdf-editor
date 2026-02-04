/**
 * Svelte action for pan/drag functionality.
 * Usage: use:pannable={{ onpanstart, onpanmove, onpanend, cursor, cursorActive }}
 *
 * Cursor options:
 * - cursor: default cursor (default: 'pointer')
 * - cursorActive: cursor during dragging (default: 'move')
 *
 * For drawing, use: cursor: 'crosshair', cursorActive: 'crosshair'
 */
export function pannable(node, params = {}) {
  let x;
  let y;
  let callbacks = params;
  let originalCursor = '';
  let isPanning = false;

  // Get cursor options with defaults
  const getCursor = () => callbacks.cursor || 'pointer';
  const getCursorActive = () => callbacks.cursorActive || 'move';

  // Set default cursor
  node.style.cursor = getCursor();

  function handleMousedown(event) {
    x = event.clientX;
    y = event.clientY;
    const target = event.target;
    const currentTarget = event.currentTarget;

    // Allow onpanstart to return false to cancel the pan operation
    const result = callbacks.onpanstart?.({ detail: { x, y, target, currentTarget } });
    if (result === false) return;

    // Set active cursor during dragging
    isPanning = true;
    originalCursor = node.style.cursor;
    node.style.cursor = getCursorActive();

    window.addEventListener('mousemove', handleMousemove);
    window.addEventListener('mouseup', handleMouseup);
  }

  function handleMousemove(event) {
    const dx = event.clientX - x;
    const dy = event.clientY - y;
    x = event.clientX;
    y = event.clientY;

    callbacks.onpanmove?.({ detail: { x, y, dx, dy } });
  }

  function handleMouseup(event) {
    x = event.clientX;
    y = event.clientY;

    // Restore cursor to default
    isPanning = false;
    node.style.cursor = originalCursor || getCursor();

    callbacks.onpanend?.({ detail: { x, y } });
    window.removeEventListener('mousemove', handleMousemove);
    window.removeEventListener('mouseup', handleMouseup);
  }

  function handleTouchStart(event) {
    if (event.touches.length > 1) return;
    const touch = event.touches[0];
    x = touch.clientX;
    y = touch.clientY;
    const target = touch.target;
    const currentTarget = event.currentTarget;

    // Allow onpanstart to return false to cancel the pan operation
    const result = callbacks.onpanstart?.({ detail: { x, y, target, currentTarget } });
    if (result === false) return;

    window.addEventListener('touchmove', handleTouchmove, { passive: false });
    window.addEventListener('touchend', handleTouchend);
  }

  function handleTouchmove(event) {
    event.preventDefault();
    if (event.touches.length > 1) return;
    const touch = event.touches[0];
    const dx = touch.clientX - x;
    const dy = touch.clientY - y;
    x = touch.clientX;
    y = touch.clientY;

    callbacks.onpanmove?.({ detail: { x, y, dx, dy } });
  }

  function handleTouchend(event) {
    const touch = event.changedTouches[0];
    x = touch.clientX;
    y = touch.clientY;

    callbacks.onpanend?.({ detail: { x, y } });
    window.removeEventListener('touchmove', handleTouchmove);
    window.removeEventListener('touchend', handleTouchend);
  }

  node.addEventListener('mousedown', handleMousedown);
  node.addEventListener('touchstart', handleTouchStart);

  return {
    update(newParams) {
      callbacks = newParams;
      // Update cursor if changed, but not while actively panning
      if (!isPanning) {
        node.style.cursor = getCursor();
      }
    },
    destroy() {
      node.removeEventListener('mousedown', handleMousedown);
      node.removeEventListener('touchstart', handleTouchStart);
    },
  };
}
