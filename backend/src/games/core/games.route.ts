import Elysia, { t } from 'elysia'
import { GamesManager } from './games.manager'
import { loadStory } from '../db/db'
import { Game } from './models/game'
import { Player } from './models/player'

export const games = new Elysia({ prefix: '/games' })
  .decorate('gamesManager', new GamesManager())
  // Get all games
  .get('/', ({ gamesManager }) => {
    return gamesManager.games.map((game) => game.toJSON())
  })
  // Create a new game
  .post(
    '/create',
    async ({ body, gamesManager, status }) => {
      const story = loadStory(body.storyId ?? 'story-1')
      const gameId = gamesManager.createGame(story)
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
    ({ params, gamesManager }) => {
      const game = gamesManager.getGame(params.id)
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
        players: t.Array(Player.t),
        votes: t.Record(t.String(), t.String()),
      }),
    }
  )
  // Join game
  .post(
    '/:id/join',
    ({ params, body, gamesManager }) => {
      const game = gamesManager.getGame(params.id)
      if (!game) throw new Error('Game not found')

      const player = new Player(crypto.randomUUID(), body.name)

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
