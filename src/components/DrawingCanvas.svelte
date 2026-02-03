<script>
  import { pannable } from '@src/utils/pannable.js';
  let { onfinish, oncancel } = $props();
  let canvas = $state();
  let x = $state(0);
  let y = $state(0);
  let path = $state('');
  let minX = $state(Infinity);
  let maxX = $state(0);
  let minY = $state(Infinity);
  let maxY = $state(0);
  let paths = $state([]);
  let drawing = $state(false);
  function handlePanStart(event) {
    if (event.detail.target !== canvas) {
      return (drawing = false);
    }
    drawing = true;
    x = event.detail.x;
    y = event.detail.y;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    paths.push(['M', x, y]);
    path += `M${x},${y}`;
  }
  function handlePanMove(event) {
    if (!drawing) return;
    x = event.detail.x;
    y = event.detail.y;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    paths.push(['L', x, y]);
    path += `L${x},${y}`;
  }
  function handlePanEnd() {
    drawing = false;
  }
  function finish() {
    if (!paths.length) return;
    const dx = -(minX - 10);
    const dy = -(minY - 10);
    const width = maxX - minX + 20;
    const height = maxY - minY + 20;
    onfinish?.({
      originWidth: width,
      originHeight: height,
      path: paths.reduce((acc, cur) => {
        return acc + cur[0] + (cur[1] + dx) + ',' + (cur[2] + dy);
      }, ''),
    });
  }
  function cancel() {
    oncancel?.();
  }
</script>

<div
  bind:this={canvas}
  use:pannable={{ onpanstart: handlePanStart, onpanmove: handlePanMove, onpanend: handlePanEnd }}
  class="relative w-full h-full select-none"
>
  <div class="absolute right-0 bottom-0 mr-4 mb-4 flex">
    <button
      onclick={cancel}
      class=" w-24 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4
      rounded mr-4"
    >
      Cancel
    </button>
    <button
      onclick={finish}
      class="w-24 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-4
      rounded"
    >
      Done
    </button>
  </div>
  <svg class="w-full h-full pointer-events-none">
    <path stroke-width="5" stroke-linejoin="round" stroke-linecap="round" d={path} stroke="black" fill="none" />
  </svg>
</div>
