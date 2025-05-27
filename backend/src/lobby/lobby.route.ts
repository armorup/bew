import { Elysia } from 'elysia'
import { chat } from './chat.route'
import { todo } from './todo.route'

export const lobby = new Elysia({ prefix: '/lobby' })
  .get('/', () => {
    return {
      status: 'ok',
    }
  })
  .use(chat)
  .use(todo)
