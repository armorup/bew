import { Elysia } from 'elysia'
import { uniqueNamesGenerator, animals } from 'unique-names-generator'

export const user = new Elysia({ prefix: '/user' })
  .state({
    user: {} as Record<string, string>, // {username: password}
    session: {} as Record<number, string>, // {sessionId: username}
  })
  .get('/guest', ({ store: { user } }) => {
    const id = crypto.randomUUID()
    const name = uniqueNamesGenerator({
      dictionaries: [animals],
      length: 1,
    })
    user[id] = name
    return { id, name }
  })
