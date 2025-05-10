<script lang="ts">
  import { timeRemaining, gameState } from '$lib/websocket';
  
  // Format seconds into MM:SS display
  const formattedTime = $derived(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });
  
  // Progress percentage for the timer bar
  const progressPercentage = $derived(() => {
    if (!gameState.activeVoting || !gameState.roundEndTime) return 0;
    const totalDuration = 30; // 30 seconds per round
    return Math.min(100, Math.max(0, (timeRemaining / totalDuration) * 100));
  });
</script>

<div class="mb-6">
  <div class="flex justify-between items-center mb-2">
    <span class="text-lg font-bold">
      {#if gameState.activeVoting}
        Time remaining:
      {:else}
        Next round in:
      {/if}
    </span>
    <span class="text-xl font-mono">{formattedTime}</span>
  </div>
  
  <div class="w-full bg-gray-200 rounded-full h-2.5">
    <div 
      class="h-2.5 rounded-full transition-all" 
      class:bg-green-500={progressPercentage > 50}
      class:bg-yellow-500={progressPercentage <= 50 && progressPercentage > 25}
      class:bg-red-500={progressPercentage <= 25}
      style="width: {progressPercentage}%">
    </div>
  </div>
</div>