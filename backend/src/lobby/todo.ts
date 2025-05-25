import Elysia, { t } from 'elysia'
import { realtime } from '../index'
import { todoSchema } from '../types/lobby'

export const todo = new Elysia({ prefix: '/todo' }).post(
  '/',
  ({ body: { todo } }) => {
    realtime.broadcast({
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
