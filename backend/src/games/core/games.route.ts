import Elysia, { t } from 'elysia'
import { loadStory } from '../db/db'
import { gamesManager } from './games.manager'
import { gameJoinable, gameSchema } from './games.schemas'
import { create } from '../../models/models'
import { user } from '../../user/user'

export const games = new Elysia({ prefix: '/games' })
  .use(user)

  .decorate('gamesManager', gamesManager)
  // Get all games
  .get(
    '/',
    ({ gamesManager }) => {
      return gamesManager.games
    },
    {
      response: t.Array(gameSchema),
    }
  )
  // Create a new game
  .post(
    '/create',
    async ({ gamesManager, status }) => {
      const game = gamesManager.createGame()
      return status(200, {
        gameId: game.id,
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
      return game
    },
    {
      params: t.Object({ id: t.String() }),
      response: gameSchema,
    }
  )
  // Join game
  .post(
    '/:id/join',
    ({ params, body, gamesManager, store: { user } }) => {
      const gameId = params.id
      const { userId } = body

      // Look up the user in the store
      const userName = user[userId]
      if (!userName) throw new Error('User not found')

      // Create the player using the stored name
      const player = create.player({ name: userName })

      // Add the player to the game
      const updatedGame = gamesManager.addPlayerTo(gameId, player)

      return {
        gameId: updatedGame.id,
        playerId: player.id,
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ userId: t.String() }),
      response: t.Object({
        gameId: t.String(),
        playerId: t.String(),
      }),
    }
  )
  .get(
    '/joinable',
    ({ gamesManager }) => {
      return gamesManager.getJoinableGames()
    },
    { response: t.Array(gameJoinable) }
  )
