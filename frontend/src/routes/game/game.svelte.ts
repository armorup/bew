import { api } from '$lib/app/api'
import type { Choice, Player, Scene } from '$lib/types/game'
import type { Game as GameType } from '$lib/types/game'

class Game {
	game: GameType | null = $state(null)
	scene: Scene | null = $state(null)
}

export const game = new Game()
