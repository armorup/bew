import { Elysia, t } from 'elysia'
import { realtimeManager } from '../../index'
import { createChat, createChatMsg } from './chat.helpers'
import type { Chat, ChatMsg } from './chat.schemas'
class ChatManager {
  private _history: Chat[] = []

  add(text: string) {
    const chat = createChat(text)
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
  .get('/', ({ chat }) => {
    return chat.history
  })
  .post(
    '/create',
    ({ body: { text }, chat }) => {
      chat.add(text)
    },
    {
      body: t.Object({ text: t.String() }),
    }
  )
