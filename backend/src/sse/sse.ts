import { gamesManager } from '../games/core/games.manager'
import { GameJoinableType } from '../games/core/models/game.joinable'

class SSE {
  private connections = new Set<ReadableStreamDefaultController<string>>()

  addConnection(connection: ReadableStreamDefaultController<string>) {
    this.connections.add(connection)
  }

  removeConnection(connection: ReadableStreamDefaultController<string>) {
    this.connections.delete(connection)
  }

  sendGameEvent(gameId: string, event: string) {
    this.connections.forEach((connection) => {
      connection.enqueue(event)
    })
  }

  subscribeToGameEvents(
    gameId: string,
    connection: ReadableStreamDefaultController<string>
  ) {
    this.connections.add(connection)
  }

  // Broadcast updates to all connected clients
  broadcast() {
    const data = JSON.stringify(this.getJoinableGames())
    for (const controller of this.connections) {
      controller.enqueue(`data: ${data}\n\n`)
    }
  }

  getJoinableGames(): GameJoinableType[] {
    return gamesManager.getJoinableGames().map((game) => game.toJSON())
  }
}

export const sse = new SSE()
