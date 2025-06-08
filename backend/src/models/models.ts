import { t, type TSchema, type Static } from 'elysia'
import { TODO_SCHEMA } from '../lobby/todo/todo.schemas'
import { CHAT_SCHEMA } from '../lobby/chat/chat.schemas'
import { gameSchemas } from '../games/core/games.schemas'

// ======================
// Type Registry System
// ======================

// Import schemas from different features
const ENTITY_SCHEMAS = {
  ...gameSchemas,
  todo: TODO_SCHEMA,
  chat: CHAT_SCHEMA,
} as const

// Convenience type exports - add new types here
export type Message = MessageTypes[keyof MessageTypes]
export type Todo = EntityTypes['todo']
export type TodoMsg = MessageTypes['todoMsg']
export type Chat = EntityTypes['chat']
export type ChatMsg = MessageTypes['chatMsg']

// ================================================
// Auto-generated Types and Schemas
// ================================================

// ************************************************
// Do not change anything beyond this point
// ************************************************

// Entity creators
export const create = Object.fromEntries(
  Object.keys(ENTITY_SCHEMAS).map((key) => [
    key,
    (data: Omit<EntityTypes[typeof key & keyof EntityTypes], 'id'>) =>
      createEntity(key as keyof EntityTypes, data),
  ])
) as {
  [K in keyof typeof ENTITY_SCHEMAS]: (
    data: Omit<EntityTypes[K], 'id'>
  ) => EntityTypes[K]
}

// *************************************************
// Auto-generate message creators based on ENTITY_SCHEMAS and create
// Usage: msg.todo(create.todo('text'))
// *************************************************
export const msg = Object.fromEntries(
  Object.keys(ENTITY_SCHEMAS).map((key) => [
    key,
    (data: any) => createMessage(key as keyof EntityTypes, data),
  ])
) as {
  [K in keyof typeof ENTITY_SCHEMAS]: (
    data: EntityTypes[K]
  ) => MessageTypes[`${K & string}Msg`]
}

export type Types = {
  [K in keyof EntityTypes]: EntityTypes[K]
} & {
  [K in keyof MessageTypes]: MessageTypes[K]
} & {
  all: EntityTypes[keyof EntityTypes]
  allMsg: MessageTypes[keyof MessageTypes]
}

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

// Type helper object for convenient access
export const Type = {
  // Entity types
  ...Object.fromEntries(
    Object.keys(ENTITY_SCHEMAS).map((key) => [key, null as any])
  ),
  // Message types
  ...Object.fromEntries(
    Object.keys(ENTITY_SCHEMAS).map((key) => [`${key}Msg`, null as any])
  ),
  // Union types
  all: null as any as EntityTypes[keyof EntityTypes],
  allMsg: null as any as MessageTypes[keyof MessageTypes],
}
// Type usage: Type.todo, Type.chat, Type.todoMsg, Type.all, Type.allMsg

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
