<script lang="ts">
  import { onMount } from 'svelte';
  import { connected, playerName, playerId } from '$lib/stores/RealtimeStore';
  import RealtimeConnection from '$lib/components/RealtimeConnection.svelte';
  import { api } from '$lib/shared';
  
  // Define types
  type OptionId = string;
  
  interface GameOption {
    id: OptionId;
    text: string;
  }
  
  interface GameScene {
    id: string;
    text: string;
    options: GameOption[];
    timeRemaining: number;
  }
  
  interface Player {
    id: string;
    name: string;
    vote: OptionId | null;
  }
  
  interface SceneHistoryEntry {
    sceneId: string;
    sceneText: string;
    choiceText: string;
    votes: number;
  }
  
  // Type for vote counts
  interface VoteCount {
    optionId: OptionId;
    count: number;
    text: string;
  }
  
  // Scene history tracking
  let sceneHistory = $state<SceneHistoryEntry[]>([]);
  
  // Mock data for prototype
  let players = $state<Player[]>([
    { id: '1', name: 'Player 1', vote: null },
    { id: '2', name: 'Player 2', vote: 'option1' },
    { id: '3', name: 'Player 3', vote: 'option2' }
  ]);
  
  let currentScene = $state<GameScene>({
    id: '1',
    text: 'You are at the entrance to a dark cave. A cool breeze flows from the darkness within.',
    options: [
      { id: 'option1', text: 'Enter the cave cautiously' },
      { id: 'option2', text: 'Look for another way around' },
      { id: 'option3', text: 'Set up camp outside and wait for daylight' }
    ],
    timeRemaining: 30 // Seconds
  });
  
  let userVote = $state<OptionId | null>(null);
  let countdownInterval: ReturnType<typeof setInterval> | undefined;
  
  // Update player's vote
  function vote(optionId: OptionId): void {
    userVote = optionId;
    
    // Find current player and update their vote
    const currentPlayerId: string | undefined = $playerId;
    if (currentPlayerId) {
      const playerIndex: number = players.findIndex(p => p.id === currentPlayerId);
      
      if (playerIndex !== -1) {
        // Update existing player's vote
        players[playerIndex].vote = optionId;
      } else {
        // Add new player to the game
        const newPlayer: Player = {
          id: currentPlayerId,
          name: $playerName || 'Guest',
          vote: optionId
        };
        
        players = [...players, newPlayer];
      }
      
      // In a real implementation, we would send this vote to the backend
      // For prototype, we'll just simulate it with a console message
      console.log(`Vote sent: ${optionId} by player ${$playerName} (${currentPlayerId})`);
      
      // This would be the actual API call in a fully implemented version:
      // api.game.vote.post({ 
      //   optionId, 
      //   sceneId: currentScene.id 
      // });
    }
  }
  
  // Calculate votes for each option
  function getVotesForOption(optionId: OptionId): number {
    return players.filter(player => player.vote === optionId).length;
  }
  
  // Function to determine winning option
  function determineWinner(): VoteCount {
    const voteCounts: VoteCount[] = currentScene.options.map(option => ({
      optionId: option.id,
      count: getVotesForOption(option.id),
      text: option.text
    }));
    
    // Sort by vote count (highest first)
    voteCounts.sort((a, b) => b.count - a.count);
    
    // Check if there's a clear winner
    if (voteCounts[0].count > voteCounts[1].count) {
      return voteCounts[0];
    } else {
      // Tie between top options - for now just pick the first one
      return voteCounts[0];
    }
  }
  
  // Function to advance to the next scene
  function advanceScene(winningOptionId: OptionId): void {
    const winner: VoteCount = determineWinner();
    
    // Save the current scene to history
    const chosenOption: GameOption | undefined = currentScene.options.find(opt => opt.id === winningOptionId);
    const historyEntry: SceneHistoryEntry = {
      sceneId: currentScene.id,
      sceneText: currentScene.text,
      choiceText: chosenOption ? chosenOption.text : 'Unknown choice',
      votes: getVotesForOption(winningOptionId)
    };
    
    sceneHistory = [...sceneHistory, historyEntry];
    
    // In a real implementation, we would fetch the next scene based on this choice
    // For the prototype, we'll create a mock follow-up scene
    const nextSceneText: string = getNextSceneText(winningOptionId);
    
    // Reset countdown and create new scene
    const newScene: GameScene = {
      id: (parseInt(currentScene.id) + 1).toString(),
      text: nextSceneText,
      options: generateNextOptions(winningOptionId),
      timeRemaining: 30
    };
    
    currentScene = newScene;
    
    // Reset players' votes
    players = players.map(player => ({ ...player, vote: null }));
    userVote = null;
    
    // Restart countdown
    startCountdown();
  }
  
  // Get next scene text based on chosen option
  function getNextSceneText(optionId: OptionId): string {
    switch(optionId) {
      case 'option1':
        return 'You enter the cave cautiously. As your eyes adjust to the darkness, you notice a faint glow coming from deeper within.';
      case 'option2':
        return 'You find a narrow path that winds around the mountain. It looks treacherous, but might lead to another entrance.';
      case 'option3':
        return 'You set up camp for the night. As darkness falls, you hear strange sounds coming from the cave.';
      default:
        return 'You continue your journey, facing new challenges ahead.';
    }
  }
  
  // Generate next options based on previous choice
  function generateNextOptions(previousChoice: OptionId): GameOption[] {
    switch(previousChoice) {
      case 'option1':
        return [
          { id: 'option1', text: 'Move toward the glow' },
          { id: 'option2', text: 'Call out to see if anyone is there' },
          { id: 'option3', text: 'Retreat from the cave' }
        ];
      case 'option2':
        return [
          { id: 'option1', text: 'Carefully navigate the path' },
          { id: 'option2', text: 'Look for a safer route' },
          { id: 'option3', text: 'Return to the cave entrance' }
        ];
      case 'option3':
        return [
          { id: 'option1', text: 'Investigate the sounds' },
          { id: 'option2', text: 'Hide in your tent' },
          { id: 'option3', text: 'Pack up and move away from the cave' }
        ];
      default:
        return [
          { id: 'option1', text: 'Continue forward' },
          { id: 'option2', text: 'Take a rest' },
          { id: 'option3', text: 'Turn back' }
        ];
    }
  }
  
  // Start countdown function
  function startCountdown(): void {
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
      if (currentScene.timeRemaining > 0) {
        currentScene.timeRemaining -= 1;
      } else {
        // Time's up, determine winning option
        if (countdownInterval) clearInterval(countdownInterval);
        
        const winner = determineWinner();
        console.log(`Voting finished! Winning option: ${winner.text} with ${winner.count} votes`);
        
        // Advance to next scene
        advanceScene(winner.optionId);
      }
    }, 1000);
  }
  
  // Initialize game
  onMount((): (() => void) => {
    // Insert the current player into the players list
    if ($playerId && $playerName) {
      if (!players.some(p => p.id === $playerId)) {
        players = [...players, { id: $playerId, name: $playerName, vote: null }];
      }
    }
    
    // Start the countdown
    startCountdown();
    
    // Return cleanup function
    return (): void => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  });
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
    <div class="timer">Time remaining: {currentScene.timeRemaining}s</div>
  </header>
  
  <main class="game-content">
    <div class="scene">
      <div class="scene-text">
        <p>{currentScene.text}</p>
      </div>
      
      <div class="options">
        <h3>What will you do?</h3>
        <div class="options-grid">
          {#each currentScene.options as option}
            <div 
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
                      style="width: {players.length > 0 ? (getVotesForOption(option.id) / players.length) * 100 : 0}%"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
    
    <aside class="sidebar">
      <div class="players-panel panel">
        <h3>Players ({players.length})</h3>
        <ul class="player-list">
          {#each players as player}
            <li class={player.id === $playerId ? 'current-player' : ''}>
              <span class="player-name">{player.name}</span>
              {#if player.vote}
                <span class="player-voted">✓ Voted</span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
      
      {#if sceneHistory.length > 0}
        <div class="history-panel panel">
          <h3>Story History</h3>
          <ul class="history-list">
            {#each sceneHistory as scene}
              <li>
                <div class="history-scene">Scene {scene.sceneId}: {scene.sceneText.substring(0, 40)}...</div>
                <div class="history-choice">→ {scene.choiceText} ({scene.votes} votes)</div>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
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
