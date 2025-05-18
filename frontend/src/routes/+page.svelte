<!-- Client (Svelte) -->
 
<script lang="ts">
  import { api } from '$lib/eden-client'
  
  let messages: string[] = []
  let todos: string[] = []
  let todo = ''
  let message = ''
  let channel : string | null = 'lobby'
  let ws: ReturnType<typeof api['ws']['subscribe']> | null = null

  function connect() {
    ws = api.ws.subscribe()

    ws.on('open', () => {
      console.log('Connected to chat room')
    })

    ws.subscribe((message) => {
      let {type, data, channel} = message.data
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
    if (message.trim()) {
      api.chat.post({ message })
      message = ''
    }
  }

  async function sendTodo() {
    if (todo.trim()) {
      await api.todo.post({ todo })
      todo = ''
    }
  }
</script>

<button on:click={connect}>Join Chat</button>

{#if ws}
  <div class="chat">
    {#each messages as msg}
      <div class="message">{msg}</div>
    {/each}
    
    <input bind:value={message} />
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
  <input placeholder="Add a todo..." bind:value={todo} />
  <button on:click={sendTodo}>Add Todo</button>
</div>