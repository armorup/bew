import { gamesManager } from '../games/core/games.manager'
import { GameStatus } from '../games/core/models/game'
import {
  GameJoinable,
  GameJoinableType,
} from '../games/core/models/game.joinable'
const connections = new Set<ReadableStreamDefaultController<string>>()

export const sendGameEvent = (gameId: string, event: string) => {
  connections.forEach((connection) => {
    connection.enqueue(event)
  })
}

export const subscribeToGameEvents = (
  gameId: string,
  connection: ReadableStreamDefaultController<string>
) => {
  connections.add(connection)
}

// Broadcast updates to all connected clients
export function broadcastUpdate() {
  const games = getJoinableGames()
  const data = JSON.stringify(games)

  for (const controller of connections) {
    controller.enqueue(`data: ${data}\n\n`)
  }
}

function getJoinableGames(): GameJoinableType[] {
  return gamesManager.games
    .filter(
      (game) => game.status === GameStatus.WAITING && game.players.size < 2
    )
    .map((game) => GameJoinable.fromGame(game).toJSON())
}
