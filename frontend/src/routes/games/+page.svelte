<script lang="ts">
  import { game } from './game.svelte';
</script>

<svelte:head>
  <title>Adventure Game</title>
</svelte:head>

<div class="game-container">
  <div class="scene-text">
    <p>{game.scene?.text}</p>
  </div>
</div>
