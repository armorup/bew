import Elysia, { t } from 'elysia'
import { realtimeManager } from '..'
import { messageSchemas } from '../models/models'

export const realtime = new Elysia().ws('/ws', {
  response: messageSchemas,

  open(ws) {
    // TODO: get userId from auth
    const randomId = Math.random().toString(36).substring(2, 15)

    ws.subscribe(realtimeManager.DEFAULT_CHANNEL)
  },

  message(ws, message) {
    // ws.send(message)
    // console.log(message)
  },
})
