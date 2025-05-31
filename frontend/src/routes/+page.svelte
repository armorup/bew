<script lang="ts">
  import { player } from '$lib/util/game.svelte';
  import { goto } from '$app/navigation';
	import { api } from "$lib/app/api"
  import { onMount } from 'svelte';

  let gameId: string | null = null;
  let error: string | null = null;

  async function hostGame() {
    error = null;
    
    const res = await api.games.create.post({});
    if (res.status === 200 && res.data?.gameId) {
      gameId = res.data?.gameId ?? null;
      goto(`/games/${gameId}`);
    } else {
      error = res.status.toString() + ' Error creating game';
    }
  }

  let messages: any[] = []

  async function consumeStream() {
    const { data, error } = await api.sse.get()
    if (error) throw error;
    for await (const chunk of data) {
      console.log('chunk', chunk)
      messages = [...messages, chunk]
    }
  }

  let newMessage = '';
  async function sendMessage() {
    await api.sse.send.post({ message: newMessage });
    newMessage = '';
  }

  onMount( () => {
    // await consumeStream();
    const eventSource = new EventSource('http://localhost:3000/sse');

    eventSource.onmessage = (event) => {
      messages = [...messages, event.data];
      console.log('Received message:', event.data);
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };

    return () => eventSource.close();
  });
  
</script>

<h1>Story</h1>
  <h2>Welcome, {player.name || 'Guest'}!</h2>

<!-- <RealtimeConnection showStatus={false} /> -->

<button onclick={hostGame}>Host Game</button>

{#if gameId}
  <p>Game created! Game ID: {gameId}</p>
{/if}
{#if error}
  <p style="color: red">{error}</p>
{/if}

<input bind:value={newMessage} placeholder="Type a message..." />
<button onclick={sendMessage}>Send</button>

<ul>
  {#each messages as msg}
    <li>{msg}</li>
  {/each}
</ul>

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

 
  p {
    margin-bottom: 1.5rem;
    font-size: 1.2rem;
  }
  
  button {
    padding: 0.75rem 2rem;
    font-size: 1.1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  /* Add page padding */
  :global(body) {
    padding: 1rem;
  }
</style>