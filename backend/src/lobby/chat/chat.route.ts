import { Elysia, t } from 'elysia'
import { realtimeManager } from '../../index'
import { create, msg, type Types } from '../../models/models'

type Chat = Types['chat']
class ChatManager {
  private _history: Chat[] = []

  add(text: string) {
    const chat = create.chat({ text })
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
