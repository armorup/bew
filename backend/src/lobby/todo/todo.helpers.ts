import { type TodoMsg, type Todo } from '../todo/todo.schemas'

export function createTodo(text: string): Todo {
  return {
    id: crypto.randomUUID(),
    text,
  }
}

export function createTodoMsg(todo: Todo): TodoMsg {
  return {
    type: 'todo',
    data: todo,
  }
}
