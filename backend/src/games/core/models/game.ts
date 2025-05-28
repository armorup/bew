import { t } from 'elysia'
import { Player } from './player'
import { Scene } from './scene'
import { Story } from './story'

export type GameType = typeof Game.t.static

export enum GameStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}
export class Game {
  static t = t.Object({
    id: t.String(),
    createdAt: t.String(),
    currentScene: Scene.t,
    players: t.Array(Player.t),
    status: t.Enum(GameStatus),
  })

  public readonly id: string
  public readonly createdAt: Date
  public currentScene: Scene
  public players: Map<string, Player> = new Map()
  public story: Story
  public status: GameStatus = GameStatus.WAITING

  constructor(id: string, story: Story) {
    this.id = id
    this.story = story
    this.currentScene = story.scenes[0]
    this.createdAt = new Date()
  }

  addPlayer(player: Player): void {
    if (this.players.has(player.id)) {
      throw new Error('Player already exists')
    }
    this.players.set(player.id, player)
  }

  toJSON(): GameType {
    return {
      id: this.id,
      createdAt: this.createdAt.toISOString(),
      currentScene: this.currentScene.toJSON(),
      players: Array.from(this.players.values()).map((player) =>
        player.toJSON()
      ),
      status: this.status,
    }
  }
}
