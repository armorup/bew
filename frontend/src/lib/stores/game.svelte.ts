import { browser } from '$app/environment'
import { getCookie } from './connection.svelte'
import type { Player } from '../types/game'

export const player = $state<Player>({
	id: browser ? getCookie('playerId') || '' : '',
	name: browser ? getCookie('playerName') || '' : '',
	vote: undefined
})

export const gameState = $state({
	players: [] as Array<Player>,
	scene: {
		id: '1',
		text: 'You are at the entrance to a dark cave. A cool breeze flows from the darkness within.',
		options: [
			{ id: 'option1', text: 'Enter the cave cautiously' },
			{ id: 'option2', text: 'Look for another way around' },
			{ id: 'option3', text: 'Set up camp outside and wait for daylight' }
		]
	}
})
