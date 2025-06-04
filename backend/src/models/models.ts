import Elysia, { t } from 'elysia'

// ======================
// Lobby Models
// ======================

// ======================
// Todo
// ======================
export const TodoSchema = t.Object({ id: t.String(), text: t.String() })
export type Todo = typeof TodoSchema.static
export const TodoMsgSchema = t.Object({
  type: t.Literal('todo'),
  data: TodoSchema,
})
export type TodoMsg = typeof TodoMsgSchema.static
export function createTodo(text: string): Todo {
  return { id: crypto.randomUUID(), text }
}
export function createTodoMsg(todo: Todo): Message {
  return { type: 'todo', data: todo }
}

// ======================
// Chat
// ======================
export const ChatSchema = t.Object({ id: t.String(), message: t.String() })
export type Chat = typeof ChatSchema.static
export const ChatMsgSchema = t.Object({
  type: t.Literal('chat'),
  data: ChatSchema,
})
export type ChatMsg = typeof ChatMsgSchema.static
export function createChat(message: string): Chat {
  return { id: crypto.randomUUID(), message }
}
export function createChatMsg(chat: Chat): ChatMsg {
  return { type: 'chat', data: chat }
}

// ======================
// Message for ws
// ======================
export const messageSchemas = t.Union([TodoMsgSchema, ChatMsgSchema])
export type Message = TodoMsg | ChatMsg
