import { t } from 'elysia'

// ------- Message schemas -------
// Define all message schemas here first

const messageSchemas = {
  chat_message: t.Object({
    type: t.Literal('chat:message'),
    data: t.String(),
  }),
  todo_create: t.Object({
    type: t.Literal('todo:create'),
    data: t.String(),
  }),
}

//------- Message class -------
export class Message {
  private static messageSchema = t.Union(Object.values(messageSchemas))

  static t = {
    body: this.messageSchema,
    response: this.messageSchema,
    query: t.Object({
      playerId: t.Optional(t.String()),
    }),
    todo: {
      schema: messageSchemas.todo_create,
      body: t.Omit(messageSchemas.todo_create, ['type']),
    },
    chat: {
      schema: messageSchemas.chat_message,
      body: t.Omit(messageSchemas.chat_message, ['type']),
    },
  }

  public type: MessageType['type']
  public data: MessageType['data']

  //------- Static convenience methods -------
  static chat(data: string) {
    return new this('chat:message', data)
  }

  static todo(data: string) {
    return new this('todo:create', data)
  }

  //------- Constructor -------
  private constructor(type: MessageType['type'], data: MessageType['data']) {
    this.type = type
    this.data = data
  }

  toJSON(): MessageType {
    return {
      type: this.type,
      data: this.data,
    }
  }
}

export type ChatType = typeof messageSchemas.chat_message.static

export type TodoType = typeof messageSchemas.todo_create.static

export type MessageType = ChatType | TodoType
