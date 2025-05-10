// WebSocket service for real-time game state
import { browser } from '$app/environment';

// State management with Svelte 5 runes
export const wsConnected = $state(false);
export const playerId = $state<string | null>(null);
export const playerCount = $state(0);

// Game state
export const gameState = $state({
	currentOptions: [] as string[],
	votes: {} as Record<string, number>,
	activeVoting: false,
	roundEndTime: 0,
	winningOption: null as string | null
});

// Vote progress timer
export const timeRemaining = $state(0);

// Socket instance
let socket: WebSocket | null = null;

// Event handlers for different message types
const messageHandlers = {
	game_state: (data: any) => {
		playerId = data.playerId;
		playerCount = data.playerCount;
		gameState.currentOptions = data.currentOptions;
		gameState.votes = data.votes;
		gameState.activeVoting = data.activeVoting;
		gameState.roundEndTime = data.roundEndTime;
		updateTimeRemaining();
	},
	player_count: (count: number) => {
		playerCount = count;
	},
	vote_update: (votes: Record<string, number>) => {
		gameState.votes = votes;
	},
	round_end: (data: any) => {
		gameState.activeVoting = false;
		gameState.winningOption = data.winningOption;
		gameState.votes = data.votes;
	},
	round_start: (data: any) => {
		gameState.currentOptions = data.options;
		gameState.activeVoting = true;
		gameState.roundEndTime = data.endTime;
		gameState.winningOption = null;

		// Reset votes
		const newVotes: Record<string, number> = {};
		for (let i = 0; i < gameState.currentOptions.length; i++) {
			newVotes[i.toString()] = 0;
		}
		gameState.votes = newVotes;

		updateTimeRemaining();
	}
};

// Initialize WebSocket connection
export function initWebSocket() {
	if (!browser || socket) return;

	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	socket = new WebSocket(`${protocol}//localhost:3000/ws`);

	socket.onopen = () => {
		wsConnected = true;
		console.log('WebSocket connection established');

		// Join the game
		sendMessage('join', {});
	};

	socket.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data);
			const handler = messageHandlers[data.type];

			if (handler) {
				handler(data.payload);
			} else {
				console.warn('Unknown message type:', data.type);
			}
		} catch (err) {
			console.error('Error handling websocket message:', err);
		}
	};

	socket.onclose = () => {
		wsConnected = false;
		console.log('WebSocket connection closed');

		// Try to reconnect after a delay
		setTimeout(() => {
			socket = null;
			initWebSocket();
		}, 2000);
	};

	socket.onerror = (error) => {
		console.error('WebSocket error:', error);
		socket?.close();
	};
}

// Send message through WebSocket
export function sendMessage(type: string, payload: any) {
	if (socket && socket.readyState === WebSocket.OPEN) {
		socket.send(JSON.stringify({ type, payload }));
	}
}

// Cast a vote
export function castVote(optionId: string) {
	sendMessage('vote', { optionId });
}

// Update the time remaining in the current round
function updateTimeRemaining() {
	if (gameState.activeVoting) {
		timeRemaining = Math.max(0, Math.floor((gameState.roundEndTime - Date.now()) / 1000));

		// Update the timer each second
		setTimeout(updateTimeRemaining, 1000);
	} else {
		timeRemaining = 0;
	}
}

// Initialize timer when browser is available
if (browser) {
	updateTimeRemaining();
}
