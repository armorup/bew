import { t, type Static } from 'elysia'

export const chatSchema = t.Object({
  id: t.String(),
  text: t.String(),
})

export const chatMsgSchema = t.Object({
  type: t.Literal('chat'),
  data: chatSchema,
})

export type Chat = Static<typeof chatSchema>
export type ChatMsg = Static<typeof chatMsgSchema>
