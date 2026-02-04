<svelte:options immutable={true} />

<script>
  import DeleteIcon from '@src/assets/icons/DeleteIcon.svelte';
  import { pannable } from '@src/utils/pannable.js';
  import { onMount } from 'svelte';
  let {
    id,
    payload,
    file,
    width,
    height,
    x,
    y,
    pageScale = 1,
    isSelected = false,
    onupdate,
    ondelete,
    onselect,
  } = $props();
  let startX = $state();
  let startY = $state();
  let canvas = $state();
  let operation = $state('');
  let direction = $state('');
  let dx = $state(0);
  let dy = $state(0);
  let dw = $state(0);
  let dh = $state(0);
  let ratio = $state(null);
  async function render() {
    // use canvas to prevent img tag's auto resize
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(payload, 0, 0);
    let scale = 1;
    const limit = 500;
    if (width > limit) {
      scale = limit / width;
    }
    if (height > limit) {
      scale = Math.min(scale, limit / height);
    }
    onupdate?.({
      width: width * scale,
      height: height * scale,
    });
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      canvas.toBlob((blob) => {
        onupdate?.({
          file: blob,
        });
      });
    }
  }
  function handlePanMove(event) {
    const _dx = (event.detail.x - startX) / pageScale;
    const _dy = (event.detail.y - startY) / pageScale;
    if (operation === 'move') {
      dx = _dx;
      dy = _dy;
      return;
    }
    if (operation === 'scale') {
      if (direction === 'left') {
        dw = -_dx;
        if (ratio !== null) {
          [dw, dh] = calculateDimensionWithRatio(dw, -Infinity);
        }
        dx = -dw;
      } else if (direction === 'left-top') {
        dw = -_dx;
        dh = -_dy;
        if (ratio !== null) {
          [dw, dh] = calculateDimensionWithRatio(dw, dh);
        }
        dy = -dh;
        dx = -dw;
      } else if (direction === 'top') {
        dh = -_dy;
        if (ratio !== null) {
          [dw, dh] = calculateDimensionWithRatio(-Infinity, dh);
        }
        dy = -dh;
      } else if (direction === 'right-top') {
        dw = _dx;
        dh = -_dy;
        if (ratio !== null) {
          [dw, dh] = calculateDimensionWithRatio(dw, dh);
        }
        dy = -dh;
      } else if (direction === 'right') {
        dw = _dx;
        if (ratio !== null) {
          [dw, dh] = calculateDimensionWithRatio(dw, -Infinity);
        }
      } else if (direction === 'right-bottom') {
        dw = _dx;
        dh = _dy;
        if (ratio !== null) {
          [dw, dh] = calculateDimensionWithRatio(dw, dh);
        }
      } else if (direction === 'bottom') {
        dh = _dy;
        if (ratio !== null) {
          [dw, dh] = calculateDimensionWithRatio(-Infinity, dh);
        }
      } else if (direction === 'left-bottom') {
        dw = -_dx;
        dh = _dy;
        if (ratio !== null) {
          [dw, dh] = calculateDimensionWithRatio(dw, dh);
        }
        dx = -dw;
      }
    }
  }

  function handlePanEnd(_event) {
    if (operation === 'move') {
      onupdate?.({
        x: x + dx,
        y: y + dy,
      });
      dx = 0;
      dy = 0;
    } else if (operation === 'scale') {
      onupdate?.({
        x: x + dx,
        y: y + dy,
        width: width + dw,
        height: height + dh,
      });
      dx = 0;
      dy = 0;
      dw = 0;
      dh = 0;
      direction = '';
    }
    operation = '';
  }
  function calculateDimensionWithRatio(dw, dh) {
    const dhFromDw = (width + dw) / ratio - height;
    if (dh > dhFromDw) {
      const dwFromDh = (height + dh) * ratio - width;
      return [dwFromDh, dh];
    }
    return [dw, dhFromDw];
  }
  function handlePanStart(event) {
    startX = event.detail.x;
    startY = event.detail.y;
    // Select this component when starting to interact
    onselect?.({ id });
    if (event.detail.target === event.detail.currentTarget) {
      return (operation = 'move');
    }
    operation = 'scale';
    direction = event.detail.target.dataset.direction;
  }
  function handleDelete() {
    ondelete?.();
  }
  function handleSelect(e) {
    e.stopPropagation();
    onselect?.({ id });
  }
  onMount(render);
  onMount(() => {
    function isShiftKey(key) {
      return key === 'Shift';
    }
    function onKeyDown(e) {
      if (isShiftKey(e.key)) {
        ratio = (width + dw) / (height + dh);
      }
    }
    function onKeyUp(e) {
      if (isShiftKey(e.key)) {
        ratio = null;
      }
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events, element_invalid_self_closing_tag -->
<div
  onclick={handleSelect}
  class="absolute left-0 top-0 select-none"
  class:ring-2={isSelected}
  class:ring-blue-500={isSelected}
  style="width: {width + dw}px; height: {height + dh}px; transform: translate({x + dx}px,
  {y + dy}px);"
>
  <div
    use:pannable={{ onpanstart: handlePanStart, onpanmove: handlePanMove, onpanend: handlePanEnd }}
    class="absolute w-full h-full cursor-grab"
    class:cursor-grabbing={operation === 'move'}
    class:operation
  >
    <div data-direction="left" class="resize-border h-full w-1 left-0 top-0 border-l cursor-ew-resize" />
    <div data-direction="top" class="resize-border w-full h-1 left-0 top-0 border-t cursor-ns-resize" />
    <div data-direction="bottom" class="resize-border w-full h-1 left-0 bottom-0 border-b cursor-ns-resize" />
    <div data-direction="right" class="resize-border h-full w-1 right-0 top-0 border-r cursor-ew-resize" />
    <div
      data-direction="left-top"
      class="resize-corner left-0 top-0 cursor-nwse-resize transform
      -translate-x-1/2 -translate-y-1/2 md:scale-25"
    />
    <div
      data-direction="right-top"
      class="resize-corner right-0 top-0 cursor-nesw-resize transform
      translate-x-1/2 -translate-y-1/2 md:scale-25"
    />
    <div
      data-direction="left-bottom"
      class="resize-corner left-0 bottom-0 cursor-nesw-resize transform
      -translate-x-1/2 translate-y-1/2 md:scale-25"
    />
    <div
      data-direction="right-bottom"
      class="resize-corner right-0 bottom-0 cursor-nwse-resize transform
      translate-x-1/2 translate-y-1/2 md:scale-25"
    />
  </div>
  <div
    onclick={handleDelete}
    class="absolute left-0 top-0 right-0 w-12 h-12 m-auto rounded-full bg-white
    cursor-pointer transform -translate-y-1/2 md:scale-40"
  >
    <DeleteIcon class="w-full h-full text-red-500" />
  </div>
  <canvas class="w-full h-full" bind:this={canvas} />
</div>

<style>
  @reference "tailwindcss";

  .operation {
    background-color: rgba(0, 0, 0, 0.3);
  }
  .resize-border {
    @apply absolute border-dashed border-gray-600;
  }
  .resize-corner {
    @apply absolute w-10 h-10 bg-blue-300 rounded-full;
  }
</style>
