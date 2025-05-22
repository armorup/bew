<script lang="ts">
  import { player } from '$lib/util/shared.svelte';
  import { goto } from '$app/navigation';
  // import RealtimeConnection from '$lib/components/RealtimeConnection.svelte';
  
  function navigateToLobby() {
    goto('/lobby');
  }
  
  function navigateToGame() {
    goto('/game');
  }
</script>

<h1>Story Party</h1>
  <h2>Welcome, {player.name || 'Guest'}!</h2>

<!-- <RealtimeConnection showStatus={false} /> -->

<div class="home-container">
  <p>Join the adventure!</p>
  <div class="button-group">
    <button class="primary-btn" onclick={navigateToLobby}>Enter Lobby</button>
    <button class="secondary-btn" onclick={navigateToGame}>Play Game</button>
  </div>
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

  .home-container {
    max-width: 600px;
    margin: 2rem auto;
    text-align: center;
  }
  
  p {
    margin-bottom: 1.5rem;
    font-size: 1.2rem;
  }
  
  .button-group {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
  
  button {
    padding: 0.75rem 2rem;
    font-size: 1.1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .primary-btn {
    background-color: #4a86e8;
    color: white;
  }
  
  .primary-btn:hover {
    background-color: #3a76d8;
  }
  
  .secondary-btn {
    background-color: #ff5722;
    color: white;
  }
  
  .secondary-btn:hover {
    background-color: #e64a19;
  }

  /* Add page padding */
  :global(body) {
    padding: 1rem;
  }
</style>