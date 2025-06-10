import { t, type Static } from 'elysia'

// Declare Schemas here
export const todoSchema = t.Object({
  id: t.String(),
  text: t.String(),
})

export const chatSchema = t.Object({
  id: t.String(),
  text: t.String(),
})

// Use AI to generate the message schema
export const todoMsgSchema = t.Object({
  type: t.Literal('todo'),
  data: todoSchema,
})

export const chatMsgSchema = t.Object({
  type: t.Literal('chat'),
  data: chatSchema,
})

// Use AI to generate the typescript types
export type Todo = Static<typeof todoSchema>
export type Chat = Static<typeof chatSchema>

export type TodoMsg = Static<typeof todoMsgSchema>
export type ChatMsg = Static<typeof chatMsgSchema>
