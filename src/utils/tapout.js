/**
 * Svelte action for detecting clicks/taps outside an element.
 * Usage: use:tapout={{ ontapout: handler }}
 */
export function tapout(node, params = {}) {
  let callbacks = params;

  function handleTouchstart(event) {
    if (!Array.from(event.touches).some((touch) => node.contains(touch.target))) {
      callbacks.ontapout?.();
    }
  }

  function handleMousedown(event) {
    if (!node.contains(event.target)) {
      callbacks.ontapout?.();
    }
  }

  window.addEventListener('touchstart', handleTouchstart);
  window.addEventListener('mousedown', handleMousedown);

  return {
    update(newParams) {
      callbacks = newParams;
    },
    destroy() {
      window.removeEventListener('touchstart', handleTouchstart);
      window.removeEventListener('mousedown', handleMousedown);
    },
  };
}
