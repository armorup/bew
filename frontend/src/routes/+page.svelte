<!-- Client (Svelte) -->
 
<script lang="ts">
  import { api, type WsSchema } from '$lib/shared.js'
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  
  let messages: string[] = [];
  let todos: string[] = [];
  
  let chatInput = '';
  let todoInput = '';
  let ws: ReturnType<typeof api['ws']['subscribe']> | null = null

  let playerId = getCookie('playerId')
  let playerName = getCookie('playerName');

  async function ensureUser() {
    playerId = getCookie('playerId');
    playerName = getCookie('playerName');
    if (!playerId || !playerName) {
      try {
        const res = await api.user.guest.get();
        if (!res) throw new Error('Failed to fetch user');
        const data =  res.data;
        if (! data || !data.id || !data.name) throw new Error('Invalid user data');
        playerId = data.id;
        playerName = data.name;
        setCookie('playerId', playerId!);
        setCookie('playerName', playerName!);
      } catch (err) {
        // Handle error: show message, prevent connect, etc.
        alert('Unable to create user. Please try again later.');
        throw err; // Or set an error state variable
      }
    }
  }

  async function connect() {
    try {
      await ensureUser();
    } catch {
      // Optionally set an error state to show in the UI
      return;
    }
    ws = api.ws.subscribe();

    ws.on('open', () => {
      console.log('Connected to chat room as', playerName, playerId);
    });

    ws.subscribe((message) => {
      let {channel,type, data} = message.data
      console.log(type, data, channel)
      
      if (type === 'todo') {
        todos = [...todos, data]
      } else if (type === 'chat') {
        messages = [...messages, data]
      }
    })

    ws.on('close', () => {
      console.log('Disconnected')
    })
  }

  function sendMessage() {
    if (chatInput.trim()) {
      api.chat.post({ message: chatInput })
      chatInput = ''
    }
  }

  async function sendTodo() {
    if (todoInput.trim()) {
      await api.todo.post({ todo: todoInput })
      todoInput = ''
    }
  }

  function setCookie(name: string, value: string, days = 365) {
    if (!browser) return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  }

  function getCookie(name: string) {
    if (!browser) return undefined;
    const value = document.cookie
      .split('; ')
      .find(row => row.startsWith(name + '='))
      ?.split('=')[1];
    return value ? decodeURIComponent(value) : undefined;
  }

  function clearCookie(name: string) {
    if (!browser) return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  onMount(() => {
    // Safe to use document/cookies here
    playerId = getCookie('playerId');
    playerName = getCookie('playerName');
    connect()
    console.log(playerId, playerName)
  });
</script>

<h1>CYOA</h1>
<h2>{playerName}</h2>

<!-- <button on:click={connect}>Join Chat</button> -->

{#if ws}
  <div class="chat">
    {#each messages as msg}
      <div class="message">{msg}</div>
    {/each}
    
    <input bind:value={chatInput} />
    <button on:click={() => sendMessage()}>Send</button>
  </div>
{/if}

<!-- Todo list -->
{#if ws}
  <div class="todos">
    <h3>Todos</h3>
    <ul>
      {#each todos as todo}
        <li>{todo}</li>
      {/each}
    </ul>
  </div>
{/if}

<!-- Add todo input and button below chat -->
<div class="todo">
  <input placeholder="Add a todo..." bind:value={todoInput} />
  <button on:click={sendTodo}>Add Todo</button>
</div>