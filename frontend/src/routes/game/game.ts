import { api } from '$lib/api/app'
import type { Scene } from '../../../../backend/src/types/game'
import type { GameType } from '$lib/types/game'

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
