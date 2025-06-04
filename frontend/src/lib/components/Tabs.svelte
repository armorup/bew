<script lang="ts">
  export let tabs: string[] = [];
  export let active: string;
  export let onSelect: (tab: string) => void = () => {};

  function select(tab: string) {
    if (tab !== active) onSelect(tab);
  }
</script>

<div class="tabs" role="tablist">
  {#each tabs as tab}
    <button
      class:active={tab === active}
      role="tab"
      aria-selected={tab === active}
      on:click={() => select(tab)}
    >
      {tab}
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: flex;
    border-bottom: 1px solid #ccc;
    background: #fff;
    height: 56px;
  }
  .tabs button {
    flex: 1;
    border: none;
    background: none;
    font-size: 1.1rem;
    padding: 1rem 0;
    color: #888;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.2s, border-color 0.2s;
  }
  .tabs button.active {
    color: #ff5722;
    border-bottom: 2px solid #ff5722;
    font-weight: bold;
    background: #f9f9f9;
  }
</style>