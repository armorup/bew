<!-- Client (Svelte) -->
 
<script lang="ts">
  import { api } from '$lib/eden-client'
  
  let payload = {
      type: 'chat',
      data: {
        message: '',
        todo: ''
      },
    channel: 'lobby',
  };
  let messages: string[] = [];
  let todos: string[] = [];
  
  let ws: ReturnType<typeof api['ws']['subscribe']> | null = null

  function connect() {
    ws = api.ws.subscribe()

    ws.on('open', () => {
      console.log('Connected to chat room')
    })

    ws.subscribe((message) => {
      let {channel,type, data} = message.data
      console.log(type, data, channel)
      
      if (type === 'todo') {
        todos = [...todos, data]
      } else {
        messages = [...messages, data]
      }
    })

    ws.on('close', () => {
      console.log('Disconnected')
    })
  }

  function sendMessage() {
    let message = payload.data.message
    if (message.trim()) {
      api.chat.post({ message })
      payload.data.message = ''
    }
  }

  async function sendTodo() {
    let todo = payload.data.todo
    if (todo.trim()) {
      await api.todo.post({ todo })
      payload.data.todo = ''
    }
  }
</script>

<button on:click={connect}>Join Chat</button>

{#if ws}
  <div class="chat">
    {#each messages as msg}
      <div class="message">{msg}</div>
    {/each}
    
    <input bind:value={payload.data.message} />
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
  <input placeholder="Add a todo..." bind:value={payload.data.todo} />
  <button on:click={sendTodo}>Add Todo</button>
</div>