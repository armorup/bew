<script lang="ts">
  import { onMount } from 'svelte';
  import { playerName } from '$lib/stores/RealtimeStore';
  import RealtimeConnection from '$lib/components/RealtimeConnection.svelte';
  import Chat from '$lib/components/Chat.svelte';
  import TodoList from '$lib/components/TodoList.svelte';
</script>

<h1>CYOA</h1>
<h2>{$playerName || 'Loading...'}</h2>

<!-- Include the realtime connection component -->
<RealtimeConnection showStatus={true} />

<!-- Chat component -->
<Chat />

<!-- Todo list component -->
<TodoList />

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
</style>