import Elysia, { t } from 'elysia'
import { realtimeManager } from '../../index'
import { type TodoMsg, type Todo } from '../todo/todo.schemas'
import { createTodo, createTodoMsg } from './todo.helpers'

class TodoManager {
  private _todos: Set<Todo> = new Set() // {todoId: todo}

  add(text: string) {
    // create a todo Record and add to _todos
    const newTodo = createTodo(text)
    this._todos.add(newTodo)
    realtimeManager.broadcast(null, createTodoMsg(newTodo))
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
