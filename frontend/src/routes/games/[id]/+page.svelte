<script lang="ts">
  export let data: { id: string, currentScene: { text: string } }; // Update the type definition
</script>

{#if data}
  <h1>{data.currentScene.text}</h1>
{:else}
  <h1>Loading...</h1>
{/if}
