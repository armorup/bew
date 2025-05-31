import Elysia, { t } from 'elysia'
import { realtimeManager } from '../index'
import { MessageType } from '../realtime/realtime.message'

class Todo {
  static t = t.Object({
    todo: t.String(),
  })
}

export const todo = new Elysia({ prefix: '/todo' }).post(
  '/',
  ({ body: { todo } }) => {
    realtimeManager.broadcast({
      channel: 'lobby',
      type: MessageType.TODO,
      data: [todo],
    })
    return { status: 'ok' }
  },
  {
    body: Todo.t,
  }
)
