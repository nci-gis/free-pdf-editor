<script>
  import { onDestroy, onMount } from 'svelte';
  let { page, onmeasure } = $props();
  let canvas;
  let width = $state(0);
  let height = $state(0);
  function measure() {
    if (width > 0) {
      onmeasure?.({
        scale: canvas.clientWidth / width,
      });
    }
  }
  async function render() {
    const _page = await page;
    const viewport = _page.getViewport({ scale: 1, rotation: 0 });
    width = viewport.width;
    height = viewport.height;
    // Wait for Svelte to update the canvas dimensions
    await new Promise((resolve) => setTimeout(resolve, 0));
    const context = canvas.getContext('2d');
    await _page.render({
      canvasContext: context,
      viewport,
    }).promise;
    measure();
    window.addEventListener('resize', measure);
  }
  onMount(render);
  onDestroy(() => {
    window.removeEventListener('resize', measure);
  });
</script>

<div>
  <canvas bind:this={canvas} class="max-w-full" style={width > 0 ? `width: ${width}px;` : ''} {width} {height}></canvas>
</div>
