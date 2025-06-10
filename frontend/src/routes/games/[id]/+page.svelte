<!-- <script lang="ts">
  export let data: { id: string, currentScene: { text: string } }; // Update the type definition
</script>

{#if data}
  <h1>{data.currentScene.text}</h1>
{:else}
  <h1>Loading...</h1>
{/if} -->

<script lang="ts">
  import { game } from './game.svelte';
  import RealtimeConnection from '$lib/components/Realtime.svelte';
</script>

<svelte:head>
  <title>Adventure Game</title>
</svelte:head>
<RealtimeConnection showStatus={true} />

<div class="game-container">
  <div class="scene-text">
    <p>Hello {game.state?.currentScene?.text}</p>
    <p>Game is null: {game.state == null}</p>
  </div>

  <div class="players-section">
    <h3>Players ({game.state?.players?.length || 0}/{game.state?.maxPlayers || 0})</h3>
    
    {#if game.state?.players && game.state?.players.length > 0}
      <div class="players-list">
        {#each game.state?.players as player (player.id)}
          <div class="player-card">
            <span class="player-name">{player.name}</span>
            {#if player.vote}
              <span class="player-vote">Voted: {player.vote}</span>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <p class="no-players">No players in the game yet.</p>
    {/if}
  </div>
</div>

<style>
  .game-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
  }

  .scene-text {
    background: #f5f5f5;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    line-height: 1.6;
  }

  .players-section {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
  }

  .players-section h3 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 1.2em;
  }

  .players-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .player-card {
    background: #e8f4f8;
    border: 1px solid #b8d4da;
    border-radius: 6px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 120px;
  }

  .player-name {
    font-weight: bold;
    color: #2c5866;
  }

  .player-vote {
    font-size: 0.85em;
    color: #5a7a85;
    font-style: italic;
  }

  .no-players {
    color: #666;
    font-style: italic;
    margin: 0;
  }

  @media (max-width: 600px) {
    .players-list {
      flex-direction: column;
    }
    
    .player-card {
      min-width: auto;
    }
  }
</style>