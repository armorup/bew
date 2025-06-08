import Elysia, { t } from 'elysia'
import { realtimeManager } from '../../index'
import { msg, type Todo } from '../../models/models'
import { create } from '../../models/models'

class TodoManager {
  private _todos: Set<Todo> = new Set() // {todoId: todo}

  add(text: string) {
    // create a todo Record and add to _todos
    const newTodo = create.todo({ text })
    this._todos.add(newTodo)
    realtimeManager.broadcast(null, msg.todo(newTodo))
  }

  get todos(): Todo[] {
    return Array.from(this._todos)
  }
}

export const todo = new Elysia({ prefix: '/todo' })
  .decorate('todoManager', new TodoManager())
  .get('/', ({ todoManager }) => {
    return todoManager.todos
  })
  .post(
    '/create',
    ({ body: { todo }, todoManager }) => {
      todoManager.add(todo)
      return todoManager.todos
    },
    {
      body: t.Object({ todo: t.String() }),
    }
  )
