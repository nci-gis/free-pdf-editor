<script>
  import { onDestroy, onMount } from 'svelte';
  let { page, onmeasure } = $props();
  let canvas;
  let width = $state(0);
  let height = $state(0);
  let cssWidth = $state(0);
  let cssHeight = $state(0);

  function measure() {
    if (width > 0 && canvas) {
      // Always use scale 1.0 for actual size rendering
      const scale = 1;
      onmeasure?.({ scale });
    }
  }

  async function render() {
    const _page = await page;

    // Use device pixel ratio for sharp rendering on high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const viewport = _page.getViewport({ scale: dpr, rotation: 0 });

    // Canvas internal resolution (high res for sharp rendering)
    width = viewport.width;
    height = viewport.height;

    // CSS display size (actual PDF size)
    cssWidth = viewport.width / dpr;
    cssHeight = viewport.height / dpr;

    // Wait for Svelte to update the canvas dimensions
    await new Promise((resolve) => setTimeout(resolve, 0));
    const context = canvas.getContext('2d');
    await _page.render({
      canvasContext: context,
      viewport,
    }).promise;

    // Wait for CSS to apply before measuring
    await new Promise((resolve) => requestAnimationFrame(resolve));
    measure();
    window.addEventListener('resize', measure);
  }
  onMount(render);
  onDestroy(() => {
    window.removeEventListener('resize', measure);
  });
</script>

<div class="w-full flex justify-center">
  <canvas
    bind:this={canvas}
    style={cssWidth > 0 ? `width: ${cssWidth}px; height: ${cssHeight}px;` : ''}
    {width}
    {height}
  ></canvas>
</div>
