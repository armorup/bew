import { Elysia } from 'elysia'
import { chat } from './chat/chat.route'
import { todo } from './todo/todo.route'

export const lobby = new Elysia({ prefix: '/lobby' })
  .get('/', () => {
    return {
      status: 'ok',
    }
  })
  .use(chat)
  .use(todo)
