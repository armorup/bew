import Elysia from 'elysia'
import { Message } from './realtime.message'
import { realtimeManager } from '..'

export const realtime = new Elysia().ws('/ws', {
  body: Message.t.body,
  response: Message.t.response,
  query: Message.t.query,

  open(ws) {
    realtimeManager.addConnection(ws)
    ws.subscribe('lobby')
  },
  message(ws, message) {},
})
