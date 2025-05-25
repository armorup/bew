import { api } from '$lib/app/api'
import type { Choice, Player, Scene } from '$lib/types/game'
import type { Game as GameType } from '$lib/types/game'

class Game {
	scene: Scene | null = $state(null)

	async fetchGame() {
		const { data } = await api.game.scene.get()
		this.scene = data
	}

	get choices(): Choice[] {
		return this.game?.scene.choices ?? []
	}

	async vote(playerId: string, choiceId: string) {
		await api.game.vote.post({
			playerId,
			choiceId
		})
	}
}

export const game = new Game()
