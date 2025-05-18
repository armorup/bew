<!-- Client (Svelte) -->
 
<script lang="ts">
  import { api } from '$lib/eden-client'
  
  let messages: string[] = []
  let todos: string[] = []
  let input = ''
  let todo = ''
  let ws: ReturnType<typeof api['ws']['subscribe']> | null = null

  function connect() {
    ws = api.ws.subscribe()

    ws.on('open', () => {
      console.log('Connected to chat room')
    })

    ws.subscribe((message) => {
      if (message.data.type === 'todo') {
        todos = [...todos, message.data.data]
      } else {
        messages = [...messages, message.data.data]
      }
    })

    ws.on('close', () => {
      console.log('Disconnected')
    })
  }

  function sendMessage() {
    if (ws && input) {
      ws.send(input)
      input = ''
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
    
    <input bind:value={input} />
    <button on:click={sendMessage}>Send</button>
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