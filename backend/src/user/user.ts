import { Elysia, t } from 'elysia'
import { uniqueNamesGenerator, animals } from 'unique-names-generator'

const userSchema = t.Object({
  id: t.String(),
  name: t.String(),
})

export const user = new Elysia({ prefix: '/user' })
  .state({
    user: {} as Record<string, string>, // {userId: userName}
    session: {} as Record<number, string>, // {sessionId: userId}
  })

  .get(
    '/guest',
    ({ store: { user } }) => {
      const id = crypto.randomUUID()
      const name = uniqueNamesGenerator({
        dictionaries: [animals],
        length: 1,
      })
      user[id] = name
      return { id, name }
    },
    {
      response: userSchema,
    }
  )
