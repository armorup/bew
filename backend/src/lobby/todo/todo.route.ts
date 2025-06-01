import Elysia from 'elysia'
import { realtimeManager } from '../../index'
import { Message } from '../../realtime/realtime.message'

class TodoManager {
  private _todos: string[] = []

  add(todo: string) {
    this._todos.push(todo)
    realtimeManager.broadcast('lobby', Message.todo(todo))
  }

  get todos(): string[] {
    return this._todos
  }
}

export const todo = new Elysia({ prefix: '/todo' })
  .decorate('todoManager', new TodoManager())
  .post(
    '/create',
    ({ body: { data }, todoManager }) => {
      todoManager.add(data)
      return todoManager.todos
    },
    {
      body: Message.t.todo.body,
    }
  )
