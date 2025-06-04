import { t, type TSchema, type Static } from 'elysia'

// ======================
// Base Schemas
// ======================
export const TodoSchema = t.Object({
  id: t.String(),
  text: t.String(),
})

export const ChatSchema = t.Object({
  id: t.String(),
  message: t.String(),
})

// ======================
// Generic Message Schema Factory
// ======================
function createMessageSchema<T extends TSchema>(type: string, dataSchema: T) {
  return t.Object({
    type: t.Literal(type),
    data: dataSchema,
  })
}

// ======================
// Message Schemas
// ======================
export const TodoMsgSchema = createMessageSchema('todo', TodoSchema)
export const ChatMsgSchema = createMessageSchema('chat', ChatSchema)
export const messageSchemas = t.Union([TodoMsgSchema, ChatMsgSchema])

// ======================
// Types
// ======================
export type Todo = Static<typeof TodoSchema>
export type Chat = Static<typeof ChatSchema>
export type TodoMsg = Static<typeof TodoMsgSchema>
export type ChatMsg = Static<typeof ChatMsgSchema>
export type Message = TodoMsg | ChatMsg

// ======================
// Generic Message Creator
// ======================
function createMessage<T>(type: string, data: T): { type: string; data: T } {
  return { type, data }
}

// ======================
// Entity Creators
// ======================
export function createTodo(text: string): Todo {
  return { id: crypto.randomUUID(), text }
}

export function createChat(message: string): Chat {
  return { id: crypto.randomUUID(), message }
}

// ======================
// Message Creators (Simplified)
// ======================
export const msg = {
  todo: (data: Todo) => createMessage('todo', data),
  chat: (data: Chat) => createMessage('chat', data),
}

// Alternative: Individual message creators if you prefer
// export const createTodoMsg = (data: Todo) => msg.todo(data)
// export const createChatMsg = (data: Chat) => msg.chat(data)
