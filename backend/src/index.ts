import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'
import { user } from './user/user'
import { games } from './games/core/games.route'
import { lobby } from './lobby/lobby.route'
import { RealtimeManager } from './realtime/realtime.manager'
import { realtime } from './realtime/realtime.route'
import { sse } from './sse/sse.route'

export const app = new Elysia()
  .use(cors())
  .use(swagger())
  .get('/', () => 'Hello.')
  .use(user)
  .use(realtime)
  .use(sse)
  .use(games)
  .use(lobby)
  .listen({ port: 3000, idleTimeout: 100 })

console.log(`🦊 Elysia is running at http://localhost:3000`)
export const realtimeManager = new RealtimeManager(app.server)

export type App = typeof app
