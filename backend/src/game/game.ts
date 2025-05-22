import { Elysia, t } from 'elysia'
import { type Story, type Scene } from './types'
import stories from './stories.json'

// Load stories using Bun's file API
// const storiesPath = new URL('./stories.json', import.meta.url).pathname
// const stories: Story[] = await Bun.file(storiesPath).json()
const story = stories[0] // Assume single story for now

// Game state
class Game {
  private _players: string[] = []
  private votes: Record<string, string> = {} // {playerId: choiceId}
  private currentSceneId: string = story.scenes[0].id

  get players() {
    return this._players
  }

  getCurrentScene(): Scene {
    return story.scenes.find((s) => s.id === this.currentSceneId)!
  }

  getVotes() {
    return this.votes
  }

  vote(playerId: string, choiceId: string) {
    this.votes[playerId] = choiceId
  }

  addPlayer(playerId: string) {
    if (!this._players.includes(playerId)) {
      this._players.push(playerId)
    }
  }

  allPlayersVoted() {
    return (
      this._players.length > 0 &&
      Object.keys(this.votes).length === this._players.length
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
    if (selectedChoice && selectedChoice.nextSceneId) {
      this.currentSceneId = selectedChoice.nextSceneId
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
