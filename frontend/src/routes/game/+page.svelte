<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from './game';
  import RealtimeConnection from '$lib/components/Network.svelte';
  
  let userVote = $state(null);
</script>

<svelte:head>
  <title>Adventure Game</title>
</svelte:head>

<div class="game-container">
  <div class="realtime-status-container">
    <RealtimeConnection showStatus={true} />
  </div>
  
  <header class="game-header">
    <div class="header-left">
      <button class="back-button" onclick={() => window.history.back()}>← Back</button>
      <h1>Choose Your Adventure</h1>
    </div>
    <div class="timer">Time remaining: 00s</div>
  </header>
  
  <main class="game-content">
    <div class="scene">
      <div class="scene-text">
        <p>{game.scene.text}</p>
      </div>
      
      <div class="options">
        <h3>What will you do?</h3>
        <div class="options-grid">
          {#each game.choices as option}
            <button
              type="button"
              class="option {userVote === option.id ? 'selected' : ''}"
              onclick={() => vote(option.id)}
            >
              <div class="option-content">
                <p>{option.text}</p>
                <div class="vote-info">
                  <div class="vote-count">Votes: {getVotesForOption(option.id)}</div>
                  <div class="vote-bar">
                    <div 
                      class="vote-bar-progress" 
                      style="width: {gameState.players.length > 0 ? (getVotesForOption(option.id) / gameState.players.length) * 100 : 0}%"
                    ></div>
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      </div>
    </div>
    
    <aside class="sidebar">
      <div class="players-panel panel">
        <h3>Players ({game.players.length})</h3>
        <ul class="player-list">
          {#each gameState.players as player}
            <li class={player.id === player.id ? 'current-player' : ''}>
              <span class="player-name">{player.name}</span>
              {#if player.vote}
                <span class="player-voted">✓ Voted</span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    </aside>
  </main>
</div>

<style>
  .game-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  .realtime-status-container {
    position: fixed;
    bottom: 10px;
    right: 10px;
    z-index: 10;
  }
  
  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .game-header h1 {
    margin: 0;
  }
  
  .back-button {
    padding: 0.3rem 0.7rem;
    background-color: #f0f0f0;
    color: #333;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .back-button:hover {
    background-color: #e0e0e0;
  }
  
  .timer {
    background-color: #333;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: 600;
  }
  
  .game-content {
    display: grid;
    grid-template-columns: 1fr 250px;
    gap: 1.5rem;
  }
  
  .scene {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  .scene-text {
    padding: 2.5rem;
    font-size: 1.4rem;
    line-height: 1.6;
    text-align: center;
    background-color: #f8f8f8;
    border-radius: 8px 8px 0 0;
  }
  
  .options {
    padding: 0 1.5rem 1.5rem;
  }
  
  .options h3 {
    margin-top: 0;
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .options-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .option {
    border: 2px solid var(--color-border);
    border-radius: 6px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
  }
  
  .option:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .option.selected {
    border-color: var(--color-primary);
    background-color: rgba(74, 134, 232, 0.1);
  }
  
  .option::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 3px;
    background-color: var(--color-primary);
    transition: width 0.3s ease;
  }
  
  .option:hover::after {
    width: 100%;
  }
  
  .option.selected::after {
    width: 100%;
  }
  
  .option-content {
    display: flex;
    flex-direction: column;
  }
  
  .option-content p {
    margin: 0 0 0.5rem;
    font-weight: 500;
  }
  
  .vote-info {
    width: 100%;
  }
  
  .vote-count {
    font-size: 0.9rem;
    color: var(--color-muted);
    margin-bottom: 0.3rem;
  }
  
  .vote-bar {
    height: 6px;
    width: 100%;
    background-color: #eee;
    border-radius: 3px;
    overflow: hidden;
  }
  
  .vote-bar-progress {
    height: 100%;
    background-color: var(--color-primary);
    border-radius: 3px;
    transition: width 0.5s ease;
  }
  
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .panel {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .panel h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.5rem;
  }
  
  .player-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .player-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .history-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 250px;
    overflow-y: auto;
  }
  
  .history-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 0.5rem;
  }
  
  .history-scene {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 0.25rem;
  }
  
  .history-choice {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-primary);
  }
  
  .current-player {
    font-weight: bold;
  }
  
  .player-voted {
    font-size: 0.8rem;
    background-color: #4caf50;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
  }
  
  @media (max-width: 768px) {
    .game-content {
      grid-template-columns: 1fr;
    }
  }
</style>
