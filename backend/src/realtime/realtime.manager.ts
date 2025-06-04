import { Elysia } from 'elysia'
import type { ServerWebSocket } from 'bun'
import type { Message } from '../models/models'
//------- WebSocket Service -------
export class RealtimeManager {
  readonly DEFAULT_CHANNEL = 'lobby'

  private server: Elysia['server']
  private connections = new Map<string, ServerWebSocket>() // {userId: WebSocket}
  private channels = new Map<string, Set<string>>() // {channelId: Set<userId>}
  private channelsByUser = new Map<string, Set<string>>() // {userId: Set<channelId>}

  constructor(server: Elysia['server']) {
    this.server = server
  }

  addConnection({
    channel,
    userId,
    ws,
  }: {
    channel: string | null
    userId: string
    ws: ServerWebSocket
  }) {
    channel = channel || this.DEFAULT_CHANNEL
    this.connections.set(userId, ws)
    this.subscribe(userId, channel)
    // ws.send(Message.todo('hello').toJSONString())
    console.log(`connections: ${this.connections.size}`)
  }

  // subscribe to a channel
  subscribe(userId: string, channel: string) {
    // get the ws connection for the user
    const ws = this.connections.get(userId)
    ws?.subscribe(channel)

    // create the channel if it doesn't exist
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set())
    }
    this.channels.get(channel)?.add(userId)

    // create the user's channel if it doesn't exist
    if (!this.channelsByUser.has(userId)) {
      this.channelsByUser.set(userId, new Set())
    }
    this.channelsByUser.get(userId)?.add(channel)
  }

  // unsubscribe from a channel
  // if channel is undefined, unsubscribe from all channels
  unsubscribe(userId: string, channel: string | undefined) {
    const ws = this.connections.get(userId)
    if (channel) {
      ws?.unsubscribe(channel)
      this.channels.get(channel)?.delete(userId)
      this.channelsByUser.get(userId)?.delete(channel)
    } else {
      // unsubscribe from all channels
      const userChannels = this.channelsByUser.get(userId)
      if (userChannels) {
        userChannels.forEach((channel) => {
          ws?.unsubscribe(channel)
        })
      }
      this.channelsByUser.delete(userId)
    }
  }

  // remove a connection
  removeConnection(userId: string) {
    const ws = this.connections.get(userId)
    const userChannels = this.channelsByUser.get(userId)
    if (ws && userChannels) {
      for (const channel of userChannels) {
        ws.unsubscribe(channel)
        this.channels.get(channel)?.delete(userId)
        if (this.channels.get(channel)?.size === 0) {
          this.channels.delete(channel)
        }
      }
    }
    this.channelsByUser.delete(userId)
    this.connections.delete(userId)
  }

  broadcast(channel: string | null, message: Message) {
    channel = channel || this.DEFAULT_CHANNEL
    console.log(`broadcasting to ${channel}`)
    this.server?.publish(channel, JSON.stringify(message))
  }
}

// ------- Notes -------
// This manager is used to broadcast messages to all connected clients
// It is instantiated in the index.ts file after the app is created
