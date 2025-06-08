import { t, type TSchema, type Static } from 'elysia'

// ======================
// Type Registry System
// ======================

// Define entity schemas in this registry
const ENTITY_SCHEMAS = {
  todo: t.Object({
    id: t.String(),
    text: t.String(),
  }),
  chat: t.Object({
    id: t.String(),
    text: t.String(),
  }),
  // *************************************************
  // Add new schemas here
  // *************************************************
  // Examples:
  // user: t.Object({
  //   id: t.String(),
  //   name: t.String(),
  //   email: t.String(),
  // }),
} as const

// Entity creators
export const create = {
  todo: (text: string) => createEntity('todo', { text }),
  chat: (text: string) => createEntity('chat', { text }),
  // *************************************************
  // When you add new schemas, add entity creators here
  // *************************************************
}

// Message creators
export const msg = {
  todo: (data: Todo) => createMessage('todo', data),
  chat: (data: Chat) => createMessage('chat', data),
  // *************************************************
  // When you add new schemas, add message creators here
  // *************************************************
}

// *************************************************
// Convenience type exports - add new types here
// *************************************************
export type Message = MessageTypes[keyof MessageTypes]
export type Todo = EntityTypes['todo']
export type TodoMsg = MessageTypes['todoMsg']
export type Chat = EntityTypes['chat']
export type ChatMsg = MessageTypes['chatMsg']

// ================================================
// Auto-generated Types and Schemas
// ================================================

// Auto-generate message schemas
const MESSAGE_SCHEMAS = Object.fromEntries(
  Object.entries(ENTITY_SCHEMAS).map(([key, schema]) => [
    `${key}Msg`,
    createMessageSchema(key as typeof key, schema),
  ])
) as {
  [K in keyof typeof ENTITY_SCHEMAS as `${K & string}Msg`]: ReturnType<
    typeof createMessageSchema<K, (typeof ENTITY_SCHEMAS)[K]>
  >
}

// Create union of all message schemas
export const messageSchemas = t.Union([
  MESSAGE_SCHEMAS.todoMsg,
  MESSAGE_SCHEMAS.chatMsg,
] as const)

// Generic message schema factory
function createMessageSchema<TType extends string, T extends TSchema>(
  type: TType,
  dataSchema: T
) {
  return t.Object({
    type: t.Literal(type),
    data: dataSchema,
  })
}
// ======================
// Auto-generated Types
// ======================

// Entity types
export type EntityTypes = {
  [K in keyof typeof ENTITY_SCHEMAS]: Static<(typeof ENTITY_SCHEMAS)[K]>
}

// Message types
export type MessageTypes = {
  [K in keyof typeof ENTITY_SCHEMAS as `${K & string}Msg`]: {
    type: K & string
    data: EntityTypes[K]
  }
}

// ======================
// Generic Creators
// ======================

// Generic message creator
function createMessage<T extends keyof EntityTypes>(
  type: T,
  data: EntityTypes[T]
): MessageTypes[`${T}Msg`] {
  return { type, data } as any
}

// Generic entity creator with ID
function createEntity<T extends keyof typeof ENTITY_SCHEMAS>(
  type: T,
  data: Omit<EntityTypes[T], 'id'>
): EntityTypes[T] {
  return { id: crypto.randomUUID(), ...data } as EntityTypes[T]
}

// ======================
// Convenience Creators
// ======================

// ======================
// Export Schemas for Validation
// ======================
// export const schemas = {
//   entities: ENTITY_SCHEMAS,
//   messages: MESSAGE_SCHEMAS,
//   messageUnion: messageSchemas,
// }

// ======================
// Helper: One-liner message creation
// ======================
// export const quickMsg = {
//   todo: (text: string) => msg.todo(create.todo(text)),
//   chat: (message: string) => msg.chat(create.chat(message)),
// }
