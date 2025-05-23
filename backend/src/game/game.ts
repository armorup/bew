import { Elysia, t } from 'elysia'
import {
  type Story,
  type Scene,
  type Player,
  playerSchema,
} from '../types/game'
import stories from './stories.json'

// Game state
class Game {
  story: Story = stories[0] // Assume single story for now
  players: Record<string, Player> = {}

  private votes: Record<string, string> = {} // {playerId: choiceId}
  private currentSceneId: string = this.story.scenes[0].id

  getCurrentScene(): Scene {
    return this.story.scenes.find((s) => s.id === this.currentSceneId)!
  }

  getVotes() {
    return this.votes
  }

  vote(playerId: string, choiceId: string) {
    this.votes[playerId] = choiceId
  }

  addPlayer(playerId: string) {
    if (!this.players[playerId]) {
      this.players[playerId] = { id: playerId, name: '', vote: undefined }
    }
  }

  get playerCount() {
    return Object.keys(this.players).length
  }

  get playerIds() {
    return Object.keys(this.players)
  }

  allPlayersVoted() {
    const playerIds = Object.keys(this.players)
    return (
      playerIds.length > 0 && playerIds.every((id) => this.players[id].vote)
    )
  }

  progressScene() {
    if (!this.allPlayersVoted()) return

    // Tally votes
    const tally: Record<string, number> = {}
    for (const choiceId of Object.values(this.votes)) {
      tally[choiceId] = (tally[choiceId] || 0) + 1
    }

    // Find majority
    let max = 0
    let selectedChoiceId = ''
    for (const [choiceId, count] of Object.entries(tally)) {
      if (count > max) {
        max = count
        selectedChoiceId = choiceId
      }
    }

    // Move to next scene
    const currentScene = this.getCurrentScene()
    const selectedChoice = currentScene.choices.find(
      (c) => c.id === selectedChoiceId
    )

    if (selectedChoice) {
      this.currentSceneId = selectedChoice.id
      this.votes = {} // Reset votes for next scene
    }
  }
}

export const game = new Elysia({ prefix: '/game' })
  .state({ game: new Game() })
  .get('/', ({ store: { game } }) => {
    return {
      scene: game.getCurrentScene(),
      votes: game.getVotes(),
    }
  })
  .get(
    '/player',
    ({ query, store: { game } }) => {
      const player = game.players[query.id]
      if (!player) {
        throw new Error('Player not found')
      }
      return player
    },
    {
      query: t.Object({ id: t.String() }),
    }
  )
  .post(
    '/join',
    ({ store: { game }, body }) => {
      const { playerId } = body as { playerId: string }
      game.addPlayer(playerId)
      return { ok: true, players: game.players }
    },
    {
      body: t.Object({ playerId: t.String() }),
    }
  )
  .post(
    '/vote',
    ({ store: { game }, body }) => {
      const { playerId, choiceId } = body as {
        playerId: string
        choiceId: string
      }
      game.vote(playerId, choiceId)
      game.progressScene()
      return { ok: true, votes: game.getVotes(), scene: game.getCurrentScene() }
    },
    {
      body: t.Object({ playerId: t.String(), choiceId: t.String() }),
    }
  )
  .post('/reset', ({ store }) => {
    store.game = new Game()
    return { ok: true }
  })
