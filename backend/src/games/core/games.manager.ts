import { createNewGame, toGameJoinable, createGameMsg } from './game.helpers'
import { GameStatus } from './game.enums'
import { realtimeManager } from '../..'
import type { Game, GameJoinable, Player } from './games.schemas'

export class GamesManager {
  private _games = new Map<string, Game>()

  get games(): Game[] {
    return Array.from(this._games.values())
  }

  hasGame(id: string): boolean {
    return this._games.has(id)
  }

  addPlayerTo(gameId: string, player: Player): Game {
    const game = this._games.get(gameId)
    if (!game) throw new Error('Game not found')

    if (game.players.some((p) => p.id === player.id)) {
      throw new Error('Player already exists')
    }

    const updatedGame = { ...game, players: [...game.players, player] }
    this._games.set(gameId, updatedGame)

    // Broadcast updated Game
    realtimeManager.broadcast(gameId, createGameMsg(updatedGame))
    return updatedGame
  }

  createGame(): Game {
    const newGame = createNewGame()
    this._games.set(newGame.id, newGame)
    return newGame
  }

  getJoinableGames(): GameJoinable[] {
    return this.games
      .filter(
        (game) =>
          game.status === GameStatus.WAITING &&
          game.players.length < game.maxPlayers
      )
      .map((game) => toGameJoinable(game))
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
      const createdAt = new Date(game.createdAt).getTime()
      if (createdAt + 1000 * 60 * 60 * 24 < Date.now()) {
        this.removeGame(id)
      }
    })
  }

  updateGame(id: string, update: Partial<Game>) {
    const game = this.games.find((g) => g.id === id)
    if (game) {
      Object.assign(game, update)
      // sse.broadcast()
    }
  }
}

export const gamesManager = new GamesManager()
export { GameStatus }
