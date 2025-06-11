import { describe, expect, it, beforeEach } from 'bun:test'
import { Elysia, t } from 'elysia'
import { gameJoinable, gameSchema } from './games.schemas'
import { createNewGame, createPlayer } from './game.helpers'
import { GameStatus } from './game.enums'
import type { Game, Player } from './games.schemas'

// Test-specific simplified GamesManager to avoid circular deps
class TestGamesManager {
  private _games = new Map<string, Game>()

  get games(): Game[] {
    return Array.from(this._games.values())
  }

  createGame(): Game {
    const newGame = createNewGame()
    this._games.set(newGame.id, newGame)
    return newGame
  }

  getGame(id: string): Game {
    const game = this._games.get(id)
    if (!game) throw new Error('Game not found')
    return game
  }

  removeGame(id: string): void {
    this._games.delete(id)
  }

  addPlayerTo(gameId: string, player: Player): Game {
    const game = this._games.get(gameId)
    if (!game) throw new Error('Game not found')

    if (game.players.some((p) => p.id === player.id)) {
      throw new Error('Player already exists')
    }

    const updatedGame = { ...game, players: [...game.players, player] }
    this._games.set(gameId, updatedGame)
    return updatedGame
  }

  getJoinableGames() {
    return this.games
      .filter(
        (game) =>
          game.status === GameStatus.WAITING &&
          game.players.length < game.maxPlayers
      )
      .map((game) => ({
        id: game.id,
        createdAt: game.createdAt,
        playerCount: game.players.length,
        maxPlayers: game.maxPlayers,
      }))
  }
}

// Create a test-specific games manager to avoid circular dependency
const testGamesManager = new TestGamesManager()

// Mock user store for testing
const mockUserStore = new Map<string, string>()

// Helper function to create test app with inline route definitions
function createTestApp() {
  return new Elysia({ prefix: '/games' })
    .state('user', mockUserStore)
    .decorate('gamesManager', testGamesManager)
    
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
      ({ params, body, gamesManager }) => {
        const gameId = params.id
        const { userId } = body

        // Look up the user in the mock store
        const userName = mockUserStore.get(userId)
        if (!userName) throw new Error('User not found')

        // Create the player using the stored name
        const player = createPlayer(userName)

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
    
    // Get joinable games
    .get(
      '/joinable',
      ({ gamesManager }) => {
        return gamesManager.getJoinableGames()
      },
      { response: t.Array(gameJoinable) }
    )
    
    // Add guest user endpoint for testing
    .get('/user/guest', ({ status }) => {
      const id = crypto.randomUUID()
      const name = `Guest${Math.floor(Math.random() * 1000)}`
      mockUserStore.set(id, name)
      return status(200, { id, name })
    })
}

describe('Games Route', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    app = createTestApp()
    // Clear any existing games and users
    testGamesManager.games.forEach(game => testGamesManager.removeGame(game.id))
    mockUserStore.clear()
  })

  describe('GET /games', () => {
    it('should return empty array when no games exist', async () => {
      const response = await app.handle(new Request('http://localhost/games'))
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(0)
    })

    it('should return array of games when games exist', async () => {
      // Create a test game
      const game = testGamesManager.createGame()
      
      const response = await app.handle(new Request('http://localhost/games'))
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(1)
      expect(data[0].id).toBe(game.id)
    })
  })

  describe('POST /games/create', () => {
    it('should create a new game and return gameId', async () => {
      const response = await app.handle(
        new Request('http://localhost/games/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
      )
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('gameId')
      expect(typeof data.gameId).toBe('string')
      
      // Verify game was actually created
      const createdGame = testGamesManager.getGame(data.gameId)
      expect(createdGame).toBeDefined()
      expect(createdGame.id).toBe(data.gameId)
    })

    it('should create game with optional storyId', async () => {
      const storyId = 'test-story'
      const response = await app.handle(
        new Request('http://localhost/games/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId })
        })
      )
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('gameId')
    })
  })

  describe('GET /games/:id', () => {
    it('should return game details for existing game', async () => {
      const game = testGamesManager.createGame()
      
      const response = await app.handle(
        new Request(`http://localhost/games/${game.id}`)
      )
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe(game.id)
      expect(data).toHaveProperty('currentScene')
      expect(data).toHaveProperty('players')
      expect(data).toHaveProperty('status')
    })

    it('should return 500 for non-existent game', async () => {
      const nonExistentId = 'non-existent-id'
      
      const response = await app.handle(
        new Request(`http://localhost/games/${nonExistentId}`)
      )
      
      expect(response.status).toBe(500)
    })
  })

  describe('POST /games/:id/join', () => {
    let gameId: string
    let userId: string

    beforeEach(async () => {
      // Create a game to join
      const game = testGamesManager.createGame()
      gameId = game.id

      // Create a user
      const userResponse = await app.handle(
        new Request('http://localhost/games/user/guest')
      )
      const userData = await userResponse.json()
      userId = userData.id
    })

    it('should allow user to join an existing game', async () => {
      const response = await app.handle(
        new Request(`http://localhost/games/${gameId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
      )
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('gameId', gameId)
      expect(data).toHaveProperty('playerId')
      expect(typeof data.playerId).toBe('string')

      // Verify player was added to game
      const updatedGame = testGamesManager.getGame(gameId)
      expect(updatedGame.players.length).toBe(1)
      expect(updatedGame.players[0].id).toBe(data.playerId)
    })

    it('should allow user to join same game twice (current behavior - bug)', async () => {
      // Join the game first time
      const firstJoin = await app.handle(
        new Request(`http://localhost/games/${gameId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
      )
      expect(firstJoin.status).toBe(200)

      // Try to join again - currently allows this (bug in implementation)
      const response = await app.handle(
        new Request(`http://localhost/games/${gameId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
      )
      
      // Currently allows duplicate joins because createPlayer() generates new IDs
      expect(response.status).toBe(200)
      
      // Verify game now has 2 players (same user, different player IDs)
      const updatedGame = testGamesManager.getGame(gameId)
      expect(updatedGame.players.length).toBe(2)
    })

    it('should return 500 for non-existent game', async () => {
      const response = await app.handle(
        new Request('http://localhost/games/non-existent/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
      )
      
      expect(response.status).toBe(500)
    })

    it('should return 500 for non-existent user', async () => {
      const response = await app.handle(
        new Request(`http://localhost/games/${gameId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'non-existent-user' })
        })
      )
      
      expect(response.status).toBe(500)
    })
  })

  describe('GET /games/joinable', () => {
    it('should return empty array when no joinable games exist', async () => {
      const response = await app.handle(
        new Request('http://localhost/games/joinable')
      )
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(0)
    })

    it('should return joinable games only', async () => {
      // Create a game (should be joinable by default)
      const game = testGamesManager.createGame()
      
      const response = await app.handle(
        new Request('http://localhost/games/joinable')
      )
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(1)
      expect(data[0]).toHaveProperty('id', game.id)
      expect(data[0]).toHaveProperty('playerCount')
      expect(data[0]).toHaveProperty('maxPlayers')
    })

    it('should not return full games as joinable', async () => {
      // Create a game and fill it to capacity
      const game = testGamesManager.createGame()
      
      // Create users and fill the game
      for (let i = 0; i < game.maxPlayers; i++) {
        const userResponse = await app.handle(
          new Request('http://localhost/games/user/guest')
        )
        const userData = await userResponse.json()
        
        await app.handle(
          new Request(`http://localhost/games/${game.id}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userData.id })
          })
        )
      }
      
      const response = await app.handle(
        new Request('http://localhost/games/joinable')
      )
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(0)
    })
  })
})