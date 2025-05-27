import { Game } from './models/game'
import { Story } from './models/story'

export class GamesManager {
  private games = new Map<string, Game>()

  hasGame(id: string): boolean {
    return this.games.has(id)
  }

  createGame(story: Story): string {
    const id = crypto.randomUUID()
    this.games.set(id, new Game(id, story))
    return id
  }

  getAllGames(): Game[] {
    return Array.from(this.games.values())
  }

  getGame(id: string): Game {
    const game = this.games.get(id)
    if (!game) throw new Error('Game not found')
    return game
  }

  removeGame(id: string): void {
    this.games.delete(id)
  }

  cleanupOldGames(): void {
    this.games.forEach((game, id) => {
      if (game.createdAt.getTime() + 1000 * 60 * 60 * 24 < Date.now()) {
        this.removeGame(id)
      }
    })
  }
}
