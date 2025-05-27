import Elysia, { t } from 'elysia'
import { realtimeServer } from '../index'
import { todoSchema } from '../types/lobby'

export const todo = new Elysia({ prefix: '/todo' }).post(
  '/',
  ({ body: { todo } }) => {
    realtimeServer.broadcast({
      channel: 'lobby',
      type: 'todo',
      data: [todo],
    })
    return { status: 'ok' }
  },
  {
    body: todoSchema,
  }
)
