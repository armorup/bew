import { StoryType } from '../../types/games'
import { Game } from './models/game'

export class GamesManager {
  private _games = new Map<string, Game>()

  get games(): Game[] {
    return Array.from(this.games.values())
  }

  hasGame(id: string): boolean {
    return this._games.has(id)
  }

  createGame(story: StoryType): string {
    const id = crypto.randomUUID()
    this._games.set(id, new Game(id, story))
    return id
  }

  getGame(id: string): Game {
    const game = this._games.get(id)
    if (!game) throw new Error('Game not found')
    return game
  }

  removeGame(id: string): void {
    this._games.delete(id)
  }

  cleanupOldGames(): void {
    this._games.forEach((game, id) => {
      if (game.createdAt.getTime() + 1000 * 60 * 60 * 24 < Date.now()) {
        this.removeGame(id)
      }
    })
  }
}
