import { t } from 'elysia'
import { Player } from './player'
import { Scene } from './scene'
import { Story } from './story'
import type { GameType } from '../../../types/games'
import type { Choice } from './choice'

export class Game {
  static t = t.Object({
    id: t.String(),
    createdAt: t.String(),
    currentScene: Scene.t,
    players: t.Array(Player.t),
  })

  public readonly id: string
  public readonly createdAt: Date
  public currentScene: Scene
  public players: Map<string, Player> = new Map()
  public story: Story

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
    }
  }
}
