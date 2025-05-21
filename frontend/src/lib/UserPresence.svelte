<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { api } from "./shared";
//   export let api; // Pass your api object as a prop

  let playerId: string | undefined;
  let playerName: string | undefined;
  let onlineUsers: { id: string, name: string }[] = [];
  let ws: ReturnType<typeof api['ws']['subscribe']> | null = null

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

  async function ensureUser() {
    playerId = getCookie('playerId');
    playerName = getCookie('playerName');
    if (!playerId || !playerName) {
      const res = await api.user.guest.get();
      const data = res.data;
      if (!data || !data.id || !data.name) throw new Error('Invalid user data');
      playerId = data.id;
      playerName = data.name;
      setCookie('playerId', playerId);
      setCookie('playerName', playerName);
    }
  }

  async function connect() {
    await ensureUser();
    ws = api.ws.subscribe();

    ws.on('open', () => {
      console.log('Connected as', playerName, playerId);
    });

    ws.subscribe((message) => {
    //   if (message.data.type === 'presence') {
    //     onlineUsers = JSON.parse(message.data.data);
    //   }
    });

    ws.on('close', () => {
      console.log('Disconnected');
    });
  }

  onMount(() => {
    connect();
  });
</script>

<div>
  <h2>Current User: {playerName} ({playerId})</h2>
  <h3>Online Users:</h3>
  <ul>
    {#each onlineUsers as user}
      <li>{user.name} ({user.id})</li>
    {/each}
  </ul>
</div>
