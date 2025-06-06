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
    message: t.String(),
  }),
  // *************************************************
  // Add new schemas here - creators are auto-generated!
  // *************************************************
  user: t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String(),
  }),
  post: t.Object({
    id: t.String(),
    title: t.String(),
    content: t.String(),
    authorId: t.String(),
  }),
} as const

// ======================
// Creator Configuration
// ======================
// Define how each entity should be created from simple parameters
const ENTITY_CREATORS = {
  todo: (text: string) => ({ text }),
  chat: (message: string) => ({ message }),
  user: (name: string, email: string) => ({ name, email }),
  post: (title: string, content: string, authorId: string) => ({
    title,
    content,
    authorId,
  }),
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

// Extract non-id fields for each entity
type EntityCreateData<T extends keyof EntityTypes> = Omit<EntityTypes[T], 'id'>

// Creator function signatures - now use the custom creator signatures
type EntityCreators = {
  [K in keyof typeof ENTITY_CREATORS]: (typeof ENTITY_CREATORS)[K] extends (
    ...args: infer P
  ) => any
    ? (...args: P) => EntityTypes[K]
    : never
}

type MessageCreators = {
  [K in keyof EntityTypes]: (data: EntityTypes[K]) => MessageTypes[`${K}Msg`]
}

// ======================
// Auto-generated Creators
// ======================

// Generic entity creator with ID
function createEntity<T extends keyof typeof ENTITY_SCHEMAS>(
  type: T,
  data: EntityCreateData<T>
): EntityTypes[T] {
  return { id: crypto.randomUUID(), ...data } as EntityTypes[T]
}

// Generic message creator
function createMessage<T extends keyof EntityTypes>(
  type: T,
  data: EntityTypes[T]
): MessageTypes[`${T}Msg`] {
  return { type, data } as any
}

// Auto-generate entity creators
export const create = Object.keys(ENTITY_SCHEMAS).reduce((acc, key) => {
  acc[key as keyof EntityTypes] = (data: any) => createEntity(key as any, data)
  return acc
}, {} as EntityCreators)

// Auto-generate message creators
export const msg = Object.keys(ENTITY_SCHEMAS).reduce((acc, key) => {
  acc[key as keyof EntityTypes] = (data: any) => createMessage(key as any, data)
  return acc
}, {} as Record<string, any>) as MessageCreators

// ================================================
// Auto-generated Message Schemas
// ================================================

// Generic message schema factory
function createMessageSchema<T extends TSchema>(type: string, dataSchema: T) {
  return t.Object({
    type: t.Literal(type),
    data: dataSchema,
  })
}

// Auto-generate message schemas
const MESSAGE_SCHEMAS = Object.fromEntries(
  Object.entries(ENTITY_SCHEMAS).map(([key, schema]) => [
    `${key}Msg`,
    createMessageSchema(key, schema),
  ])
) as {
  [K in keyof typeof ENTITY_SCHEMAS as `${K & string}Msg`]: ReturnType<
    typeof createMessageSchema<(typeof ENTITY_SCHEMAS)[K]>
  >
}

// Create union of all message schemas (auto-generated)
export const messageSchemas = t.Union(
  Object.values(MESSAGE_SCHEMAS) as [
    (typeof MESSAGE_SCHEMAS)[keyof typeof MESSAGE_SCHEMAS],
    ...(typeof MESSAGE_SCHEMAS)[keyof typeof MESSAGE_SCHEMAS][]
  ]
)

// *************************************************
// Convenience type exports - these are now optional!
// You can still export specific types if you want them
// *************************************************
export type Message = MessageTypes[keyof MessageTypes]
export type Todo = EntityTypes['todo']
export type TodoMsg = MessageTypes['todoMsg']
export type Chat = EntityTypes['chat']
export type ChatMsg = MessageTypes['chatMsg']
export type User = EntityTypes['user']
export type UserMsg = MessageTypes['userMsg']
export type Post = EntityTypes['post']
export type PostMsg = MessageTypes['postMsg']

// ======================
// Helper: One-liner message creation (auto-generated!)
// ======================
// export const quickMsg = Object.keys(ENTITY_SCHEMAS).reduce(
//   (acc, key) => {
//     acc[key as keyof EntityTypes] = (data: any) => {
//       const entity = create[key as keyof EntityTypes](data)
//       return msg[key as keyof EntityTypes](entity)
//     }
//     return acc
//   },
//   {} as {
//     [K in keyof EntityTypes]: (
//       data: EntityCreateData<K>
//     ) => MessageTypes[`${K}Msg`]
//   }
// )

// ======================
// Export Schemas for Validation
// ======================
export const schemas = {
  entities: ENTITY_SCHEMAS,
  messages: MESSAGE_SCHEMAS,
  messageUnion: messageSchemas,
}

// ======================
// Usage Examples - All Auto-generated!
// ======================

// Entity creation (auto-generated creators)
const todo = create.todo('Learn Elysia')
const chat = create.chat('Hello world')
const user = create.user('Alice', 'alice@example.com')
const post = create.post('My Post', 'Post content', user.id)

// Message creation (auto-generated creators)
const todoMsg = msg.todo(todo)
const chatMsg = msg.chat(chat)
const userMsg = msg.user(user)
const postMsg = msg.post(post)

// One-liner creation (auto-generated!)
// const quickTodo = quickMsg.todo({ text: 'Quick todo' })
// const quickChat = quickMsg.chat({ message: 'Quick chat' })
// const quickUser = quickMsg.user({ name: 'Bob', email: 'bob@example.com' })
// const quickPost = quickMsg.post({
//   title: 'Quick Post',
//   content: 'Quick content',
//   authorId: 'some-id',
// })

// Type checking still works perfectly!
// create.todo({ invalidField: 'error' }) // ❌ Type error
// quickMsg.user({ name: 'Alice' })       // ❌ Missing email field
