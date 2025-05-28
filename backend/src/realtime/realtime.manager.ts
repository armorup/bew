import Elysia from 'elysia'
import { messageSchema } from './message'

//------- WebSocket Service -------
export class RealtimeManager {
  private onlineUsers: Record<string, string> = {} // {id: name}

  constructor(private server: Elysia['server']) {}

  broadcast(message: typeof messageSchema.body.static) {
    this.server?.publish?.(message.channel, JSON.stringify(message))
  }
}

// ------- Notes -------
// This manager is used to broadcast messages to all connected clients
// It is instantiated in the index.ts file after the app is created
