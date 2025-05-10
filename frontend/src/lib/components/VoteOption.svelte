<script lang="ts">
  import { castVote, gameState } from '$lib/websocket';
  
  let { id, text, voted = false } = $props<{
    id: string;
    text: string;
    voted?: boolean;
  }>();
  
  // Get current votes for this option
  const voteCount = $derived(gameState.votes[id] || 0);
  
  // Calculate vote percentage for progress bar
  const votePercentage = $derived(() => {
    const totalVotes = Object.values(gameState.votes).reduce((sum, count) => sum + count, 0) || 1;
    return Math.round((voteCount / totalVotes) * 100);
  });
  
  function handleVote() {
    if (!voted && gameState.activeVoting) {
      castVote(id);
    }
  }
</script>

<div class="mb-4 w-full">
  <button 
    class="w-full p-4 mb-2 rounded-lg text-left transition-colors relative overflow-hidden"
    class:bg-blue-100={!voted}
    class:hover:bg-blue-200={!voted && gameState.activeVoting} 
    class:bg-blue-500={voted}
    class:text-white={voted}
    class:opacity-75={!gameState.activeVoting}
    disabled={!gameState.activeVoting}
    onclick={handleVote}
  >
    <div class="relative z-10">{text}</div>
    
    <!-- Vote percentage indicator -->
    <div 
      class="absolute left-0 top-0 bottom-0 bg-blue-300 transition-all" 
      class:bg-blue-600={voted}
      style="width: {votePercentage}%">
    </div>
  </button>
  
  <div class="flex justify-between text-sm text-gray-600">
    <span class="font-semibold">{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
    <span>{votePercentage}%</span>
  </div>
</div>