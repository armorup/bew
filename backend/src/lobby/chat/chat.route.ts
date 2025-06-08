import { Elysia, t } from 'elysia'
import { realtimeManager } from '../../index'
import { create, msg, type Chat } from '../../models/models'

class ChatManager {
  private _history: Chat[] = []

  add(message: string) {
    const chat = create.chat(message)
    this._history.push(chat)
    realtimeManager.broadcast('lobby', msg.chat(chat))
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
