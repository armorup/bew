import { Elysia, t } from 'elysia'
import { realtimeManager } from '../../index'
import {
  ChatSchema,
  createChat,
  createChatMsg,
  type Chat,
} from '../../models/models'

class ChatManager {
  private _history: Chat[] = []

  add(message: string) {
    const chat = createChat(message)
    this._history.push(chat)
    realtimeManager.broadcast('lobby', createChatMsg(chat))
  }

  get history(): Chat[] {
    return this._history
  }

  clear() {
    this._history = []
  }
}

export const chat = new Elysia({ prefix: '/chat' })
  .decorate('chat', new ChatManager())
  .post(
    '/',
    ({ body: { data }, chat }) => {
      chat.add(data)
      return chat.history
    },
    {
      body: t.Object({ data: t.String() }),
      response: t.Array(ChatSchema),
    }
  )
