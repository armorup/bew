import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'
import { websocket, WebSocketService } from './websocket'
import { chat } from './chat'
import { todo } from './todo'
import { user } from './user'
export const app = new Elysia()
  .use(cors())
  .use(swagger())
  .use(user)
  .use(websocket)
  .use(chat)
  .use(todo)
  .listen(3000)

console.log(`🦊 Elysia is running at http://localhost:3000`)

export const wsService = new WebSocketService(app.server)
export type App = typeof app
