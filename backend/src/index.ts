import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'
import { websocket, Realtime } from './realtime/realtime'
import { chat } from './lobby/chat'
import { todo } from './lobby/todo'
import { user } from './user'
import { game } from './game/game'

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .get('/', () => 'Hello.')
  .use(user)
  .use(websocket)
  .use(game)
  .use(chat)
  .use(todo)
  .listen(3000)

console.log(`🦊 Elysia is running at http://localhost:3000`)

export const wsService = new Realtime(app.server)
export type App = typeof app
