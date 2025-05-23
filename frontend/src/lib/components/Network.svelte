<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { network } from '../network/network.svelte';
  import { player } from '$lib/util/game.svelte';

  export let showStatus = false;

  onMount(() => {
    // Connection is attempted automatically when store is imported,
    // but we can explicitly call it here if needed
    network.connect();
  });

  onDestroy(() => {
    // Optional: disconnect when component is destroyed
    // Uncomment if you want websocket connections to close when
    // this component is removed
    // disconnect();
  });
</script>

{#if showStatus}
  <div class="realtime-status">
    {#if network.connection.connected}
      <div class="status-connected">Connected as {player?.name} ({player?.id})</div>
    {:else if network.connection.error}
      <div class="status-error">{network.connection.error}</div>
    {:else}
      <div class="status-connecting">Connecting...</div>
    {/if}
  </div>
{/if}

<style>
  .realtime-status {
    margin-bottom: 1rem;
  }
  
  .status-connected {
    color: green;
  }
  
  .status-error {
    color: red;
  }
  
  .status-connecting {
    color: orange;
  }
</style>