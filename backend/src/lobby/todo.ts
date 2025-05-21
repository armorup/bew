import Elysia, { t } from 'elysia'
import { wsService } from '..'

export const todo = new Elysia().post(
  '/todo',
  ({ body: { todo } }) => {
    wsService.broadcast({
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
