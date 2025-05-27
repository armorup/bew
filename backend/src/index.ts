import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'
import { realtime, Realtime } from './realtime/realtime'
import { user } from './user/user'
import { games } from './games/core/games.route'
import { lobby } from './lobby/lobby.route'

export const app = new Elysia()
  .use(cors())
  .use(swagger())
  .get('/', () => 'Hello.')
  .use(user)
  .use(realtime)
  .use(games)
  .use(lobby)
  .listen(3000)

console.log(`🦊 Elysia is running at http://localhost:3000`)
export const realtimeServer = new Realtime(app.server)
