<script lang="ts">
  export let data: { id: string, currentScene: { text: string } }; // Update the type definition
</script>

<!-- {#if data}
  <pre>{JSON.stringify(data, null, 2)}</pre>
{:else}
  <h1>Loading...</h1>
{/if} -->

{#if data}
  <h1>{data.id}</h1>
  <h1>{data.currentScene.text}</h1>
{:else}
  <h1>Loading...</h1>
{/if}
