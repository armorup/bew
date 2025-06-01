import { Elysia } from 'elysia'
import { Message, type MessageType } from './realtime.message'

//------- WebSocket Service -------
export class RealtimeManager {
  // private connections: Record<string, WebSocket> = {} // {user id: WebSocket}
  private connections: Set<any> = new Set()

  constructor(private server: Elysia['server']) {}

  broadcast(channel: string, message: Message) {
    this.server?.publish?.(channel, JSON.stringify(message))
  }

  addConnection(ws: any) {
    this.connections.add(ws)
  }
}

// ------- Notes -------
// This manager is used to broadcast messages to all connected clients
// It is instantiated in the index.ts file after the app is created
