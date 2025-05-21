<script lang="ts">
  import { onMount } from 'svelte';
  import { playerName } from '$lib/stores/RealtimeStore';
  import RealtimeConnection from '$lib/components/RealtimeConnection.svelte';
  import Chat from '$lib/components/Chat.svelte';
  import TodoList from '$lib/components/TodoList.svelte';
</script>

<h2>{$playerName || 'Loading...'}</h2>

<RealtimeConnection showStatus={false} />

<Chat />

<TodoList />

<style>
  h2 {
    font-size: 1.5rem;
    margin-bottom: 0.2rem;
    color: #555;
  }

</style>