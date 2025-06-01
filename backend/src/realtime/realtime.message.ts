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

const messageSchema = t.Union([chatSchema, todoSchema])

//------- Message class -------
export class Message {
  static t = {
    body: messageSchema,
    response: messageSchema,
    query: t.Object({
      playerId: t.Optional(t.String()),
    }),
  }

  constructor(
    public channel: string,
    public type: MessageEnum,
    public data: string
  ) {}

  toJSON() {
    return {
      channel: this.channel,
      type: this.type,
      data: this.data,
    }
  }
}

// export type MessageBodyType = typeof Message.t.body.static
// export type MessageResponseType = typeof Message.t.response.static
// export type MessageQueryType = typeof Message.t.query.static
