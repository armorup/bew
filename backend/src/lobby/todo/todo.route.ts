import Elysia, { t } from 'elysia'
import { realtimeManager } from '../../index'
import { MessageEnum } from '../../realtime/realtime.message'

class TodoManager {
  static t = t.Object({
    todo: t.String(),
  })
  private _todos: string[] = []

  add(todo: string) {
    this._todos.push(todo)
    realtimeManager.broadcast('lobby', {
      type: MessageEnum.TODO,
      data: todo,
    })
  }

  get todos(): string[] {
    return this._todos
  }
}

export const todo = new Elysia({ prefix: '/todo' })
  .decorate('todoManager', new TodoManager())
  .post(
    '/',
    ({ body: { todo }, todoManager }) => {
      todoManager.add(todo)
      return todoManager.todos
    },
    {
      body: TodoManager.t,
    }
  )
