import { Game } from './models/game'
import { GameJoinable } from './models/game.joinable'
import { Story } from './models/story'

class GamesManager {
  private _games = new Map<string, Game>()

  get games(): Game[] {
    return Array.from(this._games.values())
  }

  hasGame(id: string): boolean {
    return this._games.has(id)
  }

  createGame(story: Story): string {
    const id = crypto.randomUUID()
    this._games.set(id, new Game(id, story))
    return id
  }

  getJoinableGames(): GameJoinable[] {
    return this.games.map((game) => new GameJoinable(game.id, game.createdAt))
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

export const gamesManager = new GamesManager()
