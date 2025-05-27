import { t } from 'elysia'
import { Player } from './player'
import { Scene } from './scene'
import { Story } from './story'

export class Game {
  static t = t.Object({
    id: t.String(),
    createdAt: t.String(),
    currentSceneId: t.String(),
    players: t.Array(Player.t),
    votes: t.Array(t.String()),
  })

  public readonly id: string
  public readonly createdAt: Date
  public currentSceneId: string
  public players: Map<string, Player> = new Map()
  public votes: Map<string, string> = new Map() // playerId -> choiceId
  public story: Story

  constructor(id: string, story: Story) {
    this.id = id
    this.story = story
    this.currentSceneId = story.scenes[0].id
    this.createdAt = new Date()
  }

  get currentScene(): Scene {
    const scene = this.story.scenes.find((s) => s.id === this.currentSceneId)
    if (!scene) throw new Error('Invalid scene state')
    return scene
  }

  addPlayer(player: Player): void {
    if (this.players.has(player.id)) {
      throw new Error('Player already exists')
    }
    this.players.set(player.id, player)
  }
}
