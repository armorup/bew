<!-- Client (Svelte) -->
 
<script lang="ts">
  import { api, type WsSchema } from '$lib/shared.js'
  
  let messages: string[] = [];
  let todos: string[] = [];
  
  let chatInput = '';
  let todoInput = '';
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
</script>

<button on:click={connect}>Join Chat</button>

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