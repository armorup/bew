<script lang="ts">
  import { onMount } from 'svelte';

  let notes: string[] = [];
  let newNote = '';
  let editIndex: number | null = null;
  let editValue = '';
  let error = '';

  // Fetch all notes
  async function fetchNotes() {
    try {
      const res = await fetch('http://localhost:3000/note');
      notes = await res.json();
    } catch (e) {
      error = 'Failed to fetch notes.';
    }
  }

  // Add a new note
  async function addNote() {
    if (!newNote.trim()) return;
    const res = await fetch('http://localhost:3000/note', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: newNote })
    });
    if (res.ok) {
      newNote = '';
      await fetchNotes();
    } else {
      error = 'Failed to add note.';
    }
  }

  // Start editing a note
  function startEdit(i: number) {
    editIndex = i;
    editValue = notes[i];
  }

  // Save edited note
  async function saveEdit(i: number) {
    const res = await fetch(`http://localhost:3000/note/${i}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: editValue })
    });
    if (res.ok) {
      editIndex = null;
      editValue = '';
      await fetchNotes();
    } else {
      error = 'Failed to update note.';
    }
  }

  // Delete a note
  async function deleteNote(i: number) {
    const res = await fetch(`http://localhost:3000/note/${i}`, {
      method: 'DELETE' });
    if (res.ok) {
      await fetchNotes();
    } else {
      error = 'Failed to delete note.';
    }
  }

  onMount(fetchNotes);
</script>

<main class="container mx-auto p-4 max-w-xl">
  <div class="bg-white shadow-lg rounded-lg p-6">
    <h1 class="text-2xl font-bold mb-4">Notes</h1>
    {#if error}
      <div class="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
    {/if}
    <ul class="mb-4">
      {#each notes as note, i}
        <li class="flex items-center mb-2">
          {#if editIndex === i}
            <input class="border p-1 flex-1 mr-2" bind:value={editValue} />
            <button class="bg-green-500 text-white px-2 py-1 rounded mr-1" on:click={() => saveEdit(i)}>Save</button>
            <button class="bg-gray-300 px-2 py-1 rounded" on:click={() => { editIndex = null; }}>Cancel</button>
          {:else}
            <span class="flex-1">{note}</span>
            <button class="bg-blue-500 text-white px-2 py-1 rounded mr-1" on:click={() => startEdit(i)}>Edit</button>
            <button class="bg-red-500 text-white px-2 py-1 rounded" on:click={() => deleteNote(i)}>Delete</button>
          {/if}
        </li>
      {/each}
    </ul>
    <div class="flex">
      <input class="border p-1 flex-1 mr-2" placeholder="New note..." bind:value={newNote} on:keydown={(e) => e.key === 'Enter' && addNote()} />
      <button class="bg-green-600 text-white px-4 py-1 rounded" on:click={addNote}>Add</button>
    </div>
  </div>
</main>

<style>
  :global(body) {
    background-color: #f3f4f6;
    min-height: 100vh;
  }
</style>
