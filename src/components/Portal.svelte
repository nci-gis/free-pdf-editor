<script>
  import { onMount } from "svelte";
  
  let portal;
  
  onMount(() => {
    if (portal) {
      document.body.appendChild(portal);
      return () => {
        if (portal?.parentNode) {
          portal.parentNode.removeChild(portal);
        }
      };
    }
  });
</script>

<div bind:this={portal}>
  <slot />
</div>
