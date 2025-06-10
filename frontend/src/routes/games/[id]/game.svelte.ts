import type { Game as GameType, Scene } from '../../../../../backend/src/models/types'

class Game {
	state = $state(null as GameType | null)
}

export const game = new Game()
