import Elysia, { t } from 'elysia'
import { wsService } from '.'

//------- Schema and types -------
const MessageEnum = {
  chat: 'chat',
  todo: 'todo',
} as const

const wsSchema = {
  body: t.Object({
    channel: t.String(),
    type: t.Enum(MessageEnum),
    data: t.String(),
  }),
  response: t.Object({
    channel: t.String(),
    type: t.Enum(MessageEnum),
    data: t.String(),
  }),
  query: t.Object({
    playerId: t.Optional(t.String()),
  }),
} as const

export type WsSchema = typeof wsSchema.body.static

//------- WebSocket Service -------
export class WebSocketService {
  private onlineUsers: Record<string, string> = {} // {id: name}

  constructor(private server: Elysia['server']) {}

  broadcast(message: typeof wsSchema.body.static) {
    this.server?.publish?.(message.channel, JSON.stringify(message))
  }
}

export const websocket = new Elysia().ws('/ws', {
  body: wsSchema.body,
  response: wsSchema.response,
  query: wsSchema.query,
  open(ws) {
    const { playerId } = ws.data?.query || {}
    ws.subscribe('lobby')
  },
  message(ws, message) {},
})
