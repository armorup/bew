<script lang="ts">
  import { player } from '$lib/shared.svelte';
  import { goto } from '$app/navigation';
  import RealtimeConnection from '$lib/components/RealtimeConnection.svelte';
  import Chat from '$lib/components/Chat.svelte';
  import TodoList from '$lib/components/TodoList.svelte';
  
  function startGame() {
    goto('/game');
  }
</script>

<h1>Chat Room</h1>
<h2>{player.name || 'Loading...'}</h2>

<RealtimeConnection showStatus={true} />

<div class="lobby-actions">
  <button class="start-game-btn" onclick={startGame}>Start Adventure Game</button>
</div>

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
  
  .lobby-actions {
    margin: 1rem 0;
    text-align: center;
  }
  
  .start-game-btn {
    background-color: #ff5722;
    color: white;
    padding: 0.75rem 2rem;
    font-size: 1.1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .start-game-btn:hover {
    background-color: #e64a19;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
