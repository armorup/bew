import Elysia, { t } from 'elysia'
import { realtimeServer } from '../index'

class Todo {
  static t = t.Object({
    todo: t.String(),
  })
}

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
    body: Todo.t,
  }
)
