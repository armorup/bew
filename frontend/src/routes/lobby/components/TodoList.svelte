<!-- src/lib/components/TodoList.svelte -->
<script lang="ts">
  import { network } from '$lib/network/network.svelte';
  import { lobby } from '../lobby.svelte';
  
  let todoInput = '';
  
  async function handleAddTodo() {
    if (todoInput.trim()) {
      lobby.sendTodo(todoInput);
      todoInput = '';
    }
  }
</script>

<div class="todo-container">
  <h3>Todo</h3>
  
  {#if network.connection.connected}
    <ul class="todos">
      {#each lobby.state.todos as todo}
        <li>{todo}</li>
      {:else}
        <li class="empty">No todos yet</li>
      {/each}
    </ul>
    
    <div class="todo-input">
      <input 
        bind:value={todoInput} 
        placeholder="Add a todo..." 
        on:keydown={(e) => e.key === 'Enter' && handleAddTodo()}
      />
      <button on:click={handleAddTodo}>Add</button>
    </div>
  {:else}
    <div class="connecting">Connecting...</div>
  {/if}
</div>

<style>
  .todo-container {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    margin-top: 1rem;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  .todos {
    list-style-type: none;
    padding-left: 0;
    margin-bottom: 1rem;
  }
  
  .todos li {
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
  }
  
  .todos li.empty {
    color: #999;
    font-style: italic;
  }
  
  .todo-input {
    display: flex;
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
    text-align: center;
    color: #666;
    padding: 1rem 0;
  }
</style>