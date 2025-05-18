<!-- Client (Svelte) -->
<script lang="ts">
  import { api } from '$lib/eden-client'

  let messages: string[] = []
  let input = ''
  let ws: ReturnType<typeof api['chat']['subscribe']> | null = null

  function connect() {
    ws = api.chat.subscribe()

    ws.on('open', () => {
      console.log('Connected to chat room')
    })

    ws.subscribe((message) => {
      messages = [...messages, message.data]
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