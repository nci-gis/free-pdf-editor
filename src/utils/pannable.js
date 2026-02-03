/**
 * Svelte action for pan/drag functionality.
 * Usage: use:pannable={{ onpanstart, onpanmove, onpanend }}
 */
export function pannable(node, params = {}) {
  let x;
  let y;
  let callbacks = params;

  function handleMousedown(event) {
    x = event.clientX;
    y = event.clientY;
    const target = event.target;

    callbacks.onpanstart?.({ detail: { x, y, target } });

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

    callbacks.onpanstart?.({ detail: { x, y, target } });

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
    },
    destroy() {
      node.removeEventListener('mousedown', handleMousedown);
      node.removeEventListener('touchstart', handleTouchStart);
    },
  };
}
