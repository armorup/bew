import Elysia, { t } from 'elysia'
import { GameManager } from './core/game.manager'
import { loadStory } from './db/story'
import type { Player, Story } from '../types/game'
import { playerSchema } from '../types/game'

export const games = new Elysia({ prefix: '/games' })
  .decorate('gameManager', new GameManager())
  // Get all games
  .get('/', ({ gameManager }) => ({
    games: gameManager.getAllGames(),
  }))
  // Create a new game
  .post(
    '/create',
    async ({ body, gameManager, status }) => {
      const story = loadStory(body.storyId ?? 'story-1')
      const gameId = gameManager.createGame(story)
      return status(200, {
        gameId: gameId,
      })
    },
    {
      body: t.Object({ storyId: t.Optional(t.String()) }),
      response: t.Object({
        gameId: t.String(),
      }),
    }
  )
  // Get game state
  .get(
    '/:id',
    ({ params, gameManager }) => {
      const game = gameManager.getGame(params.id)
      if (!game) throw new Error('Game not found')

      return {
        id: game.id,
        scene: game.currentScene,
        players: Array.from(game.players.values()),
        votes: Object.fromEntries(game.votes),
      }
    },
    {
      params: t.Object({ id: t.String() }),
      response: t.Object({
        id: t.String(),
        scene: t.Any(),
        players: t.Array(playerSchema),
        votes: t.Record(t.String(), t.String()),
      }),
    }
  )
  // Join game
  .post(
    '/:id/join',
    ({ params, body, gameManager }) => {
      const game = gameManager.getGame(params.id)
      if (!game) throw new Error('Game not found')

      const player: Player = {
        id: crypto.randomUUID(),
        name: body.name,
      }

      game.addPlayer(player)
      return {
        gameId: game.id,
        playerId: player.id,
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ name: t.String() }),
      response: t.Object({
        gameId: t.String(),
        playerId: t.String(),
      }),
    }
  )
