import { t } from 'elysia'

//------- Schema and types -------
const MessageEnum = {
  chat: 'chat',
  todo: 'todo',
} as const

export const messageSchema = {
  body: t.Object({
    channel: t.String(),
    type: t.Enum(MessageEnum),
    data: t.String(),
  }),
  response: t.Object({
    channel: t.String(),
    type: t.Enum(MessageEnum),
    data: t.String(),
  }),
  query: t.Object({
    playerId: t.Optional(t.String()),
  }),
} as const

export type Message = typeof messageSchema.body.static
