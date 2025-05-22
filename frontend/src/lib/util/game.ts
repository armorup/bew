import type { api } from '$lib/elysia.ts'
import { game, type Player } from './shared.svelte'

class Game {
	constructor() {}

	addPlayer(player: Player) {
		game.players.push(player)
	}

	removePlayer(player: Player) {
		game.players = game.players.filter((p) => p?.id !== player.id)
	}
}
