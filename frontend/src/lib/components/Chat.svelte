<script lang="ts">
  import { realtime } from '$lib/util/realtime';
  import { connection, lobby } from '$lib/util/shared.svelte';
  let chatInput = '';
  
  function handleSendMessage() {
    if (chatInput.trim()) {
      realtime.sendMessage(chatInput);
      chatInput = '';
    }
  }
</script>

<div class="chat-container">
  {#if connection.connected}
    <div class="messages">
      {#each lobby.messages as msg}
        <div class="message">{msg}</div>
      {/each}
    </div>
    
    <div class="chat-input">
      <input 
        bind:value={chatInput} 
        placeholder="Type a message..." 
        on:keydown={(e) => e.key === 'Enter' && handleSendMessage()}
      />
      <button on:click={handleSendMessage}>Send</button>
    </div>
  {:else}
    <div class="connecting">Connecting to chat...</div>
  {/if}
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 300px;
    border: 1px solid #ccc;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background-color: #f9f9f9;
  }
  
  .message {
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .chat-input {
    display: flex;
    padding: 0.5rem;
    border-top: 1px solid #eee;
  }
  
  input {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    margin-right: 0.5rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    background-color: #4a86e8;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    background-color: #3a76d8;
  }
  
  .connecting {
    padding: 1rem;
    text-align: center;
    color: #666;
  }
</style>