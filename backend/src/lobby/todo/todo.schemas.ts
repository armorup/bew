import { t } from 'elysia'

// User-Defined schema
export const todoSchema = t.Object({
  id: t.String(),
  text: t.String(),
})

// Use AI to generate the message schema
export const todoMsgSchema = t.Object({
  type: t.Literal('todo'),
  data: todoSchema,
})

// AI auto completes the code to create the types
export type Todo = typeof todoSchema.static
export type TodoMsg = typeof todoMsgSchema.static
