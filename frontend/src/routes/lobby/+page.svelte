<script lang="ts">
  import { onMount } from 'svelte';
  import { playerName } from '$lib/stores/RealtimeStore';
  import RealtimeConnection from '$lib/components/RealtimeConnection.svelte';
  import Chat from '$lib/components/Chat.svelte';
  import TodoList from '$lib/components/TodoList.svelte';
</script>

<h1>Lobby</h1>
<h2>{$playerName || 'Loading...'}</h2>

<RealtimeConnection showStatus={true} />

<div class="lobby-container">
  <Chat />
  <TodoList />
</div>

<style>
  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #555;
  }
  
  .lobby-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }
  
  @media (min-width: 768px) {
    .lobby-container {
      flex-direction: row;
    }
    
    .lobby-container :global(.chat-container),
    .lobby-container :global(.todo-container) {
      flex: 1;
    }
  }
</style>
