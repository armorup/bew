import { t } from 'elysia'

//------- Schema and types -------
export enum MessageEnum {
  CHAT = 'chat',
  TODO = 'todo',
}

//------- Schema -------
const chatSchema = t.Object({
  type: t.Literal(MessageEnum.CHAT),
  data: t.String(),
})

const todoSchema = t.Object({
  type: t.Literal(MessageEnum.TODO),
  data: t.String(),
})

export type ChatType = typeof chatSchema.static

export type TodoType = typeof todoSchema.static

const messageSchema = t.Union([chatSchema, todoSchema])

export type MessageType = ChatType | TodoType

//------- Message class -------
export class Message {
  static t = {
    body: messageSchema,
    response: messageSchema,
    query: t.Object({
      playerId: t.Optional(t.String()),
    }),
  }

  public type: MessageType['type']
  public data: MessageType['data']

  //------- Static convenience methods -------
  static chat(data: string) {
    return new this(MessageEnum.CHAT, data)
  }

  static todo(data: string) {
    return new this(MessageEnum.TODO, data)
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
