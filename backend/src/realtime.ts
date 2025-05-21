import Elysia, { t } from 'elysia'

//------- Schema and types -------
const MessageEnum = {
  chat: 'chat',
  todo: 'todo',
} as const

const messageSchema = {
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

export type MessageSchema = typeof messageSchema.body.static

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
