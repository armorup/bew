<script lang="ts">
  import { player } from '$lib/util/game.svelte';
  import { goto } from '$app/navigation';
  import Realtime from '$lib/components/Realtime.svelte';
  import Chat from './components/Chat.svelte';
  import TodoList from './components/TodoList.svelte';
  import { onMount } from 'svelte';
  import Tabs from '$lib/components/Tabs.svelte';

  let isMobile = false;
  type TabItem = 'Chat' | 'Todo' | 'Game';
  let activeTab: TabItem = 'Chat';
  const tabList: TabItem[] = ['Chat', 'Todo', 'Game'];

  function startGame() {
    goto('/game');
  }

  function handleResize() {
    isMobile = window.innerWidth < 768;
  }

  onMount(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });
</script>

<h2>Lobby - {player.name || 'Loading...'}</h2>

<Realtime showStatus={false} />

{#if isMobile}
  <div class="mobile-panel">
    {#if activeTab === 'Chat'}
      <Chat />
    {:else if activeTab === 'Todo'}
      <TodoList />
    {:else if activeTab === 'Game'}
      <div class="game-tab-content">
        <div class="game-placeholder">Game coming soon!</div>
        <button class="start-game-btn" on:click={startGame}>Start</button>
      </div>
    {/if}
  </div>
  <Tabs tabs={tabList} active={activeTab} onSelect={tab => activeTab = tab as TabItem} />
{:else}
  <div class="lobby-container">
    <Chat />
    <TodoList />
    <div class="game-tab-content">
      <div class="game-placeholder">Game coming soon!</div>
      <button class="start-game-btn" on:click={startGame}>Start</button>
    </div>
  </div>
{/if}

<style>
  /* ... existing styles ... */
  .game-tab-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    min-height: 200px;
  }
</style>