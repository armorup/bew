import { api } from '$lib/elysia'
import type { Scene } from '../../../backend/src/game/types'
import { gameState, type Player } from './shared.svelte'

type GameType = Awaited<ReturnType<typeof api.game.get>>['data']

class Game {
	private game: GameType | null = null

	async fetchGame() {
		const { data } = await api.game.get()
		this.game = data
	}

	getCurrentScene(): Scene | null {
		return this.game?.scene ?? null
	}

	getChoices() {
		return this.game?.scene.choices ?? []
	}

	async vote(playerId: string, choiceId: string) {
		await api.game.vote.post({
			playerId,
			choiceId
		})
	}
}
