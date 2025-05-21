import Elysia, { t } from 'elysia'
import { messageSchema } from './types'

//------- WebSocket Service -------
export class Realtime {
  private onlineUsers: Record<string, string> = {} // {id: name}

  constructor(private server: Elysia['server']) {}

  broadcast(message: typeof messageSchema.body.static) {
    this.server?.publish?.(message.channel, JSON.stringify(message))
  }
}

export const websocket = new Elysia().ws('/ws', {
  body: messageSchema.body,
  response: messageSchema.response,
  query: messageSchema.query,
  open(ws) {
    const { playerId } = ws.data?.query || {}
    ws.subscribe('lobby')
  },
  message(ws, message) {},
})
