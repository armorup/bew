import { t } from 'elysia'
import { Game } from './game'

export type GameJoinableType = typeof GameJoinable.t.static

export class GameJoinable {
  static t = t.Object({
    id: t.String(),
    createdAt: t.String(),
    playerCount: t.Number(),
    maxPlayers: t.Number(),
  })

  public readonly id: string
  public readonly createdAt: Date
  public readonly playerCount: number
  public readonly maxPlayers: number

  constructor(
    id: string,
    createdAt: Date,
    playerCount: number = 0,
    maxPlayers: number = 10
  ) {
    this.id = id
    this.createdAt = createdAt
    this.playerCount = playerCount
    this.maxPlayers = maxPlayers
  }

  static fromGame(game: Game): GameJoinable {
    return new GameJoinable(game.id, game.createdAt, game.players.size, 2)
  }

  toJSON(): GameJoinableType {
    return {
      id: this.id,
      createdAt: this.createdAt.toISOString(),
      playerCount: this.playerCount,
      maxPlayers: this.maxPlayers,
    }
  }
}
