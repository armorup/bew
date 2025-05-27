import { Elysia } from 'elysia'
import { chat } from './chat'
import { todo } from './todo'

export const lobby = new Elysia({ prefix: '/lobby' })
  .get('/', () => {
    return {
      status: 'ok',
    }
  })
  .use(chat)
  .use(todo)
