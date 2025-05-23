import Elysia, { t } from 'elysia'
import { realtime } from '../index'

export const todo = new Elysia().post(
  '/todo',
  ({ body: { todo } }) => {
    realtime.broadcast({
      channel: 'lobby',
      type: 'todo',
      data: todo,
    })
    return { status: 'ok' }
  },
  {
    body: t.Object({
      todo: t.String(),
    }),
  }
)
