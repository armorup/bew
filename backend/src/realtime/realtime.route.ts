import Elysia from 'elysia'
import { messageSchema } from './realtime.message'

export const realtime = new Elysia().ws('/ws', {
  body: messageSchema.body,
  response: messageSchema.response,
  query: messageSchema.query,
  open(ws) {
    const { playerId } = ws.data?.query || {}
    ws.subscribe('lobby')
  },
  message(ws, message) {},
})
