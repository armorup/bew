import { t } from 'elysia'

//------- Schema and types -------
export enum MessageType {
  CHAT = 'chat',
  TODO = 'todo',
  PLAYERS = 'players',
}

export const messageSchema = {
  body: t.Object({
    channel: t.String(),
    type: t.Enum(MessageType),
    data: t.Array(t.String()),
  }),
  response: t.Object({
    channel: t.String(),
    type: t.Enum(MessageType),
    data: t.String(),
  }),
  query: t.Object({
    playerId: t.Optional(t.String()),
  }),
} as const

export type Message = typeof messageSchema.body.static
