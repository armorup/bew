import { Elysia, t } from 'elysia'
import { realtimeServer } from '../index'

class Chat {
  private _history: string[] = []

  add(message: string) {
    this._history.push(message)
    realtimeServer.broadcast({
      channel: 'lobby',
      type: 'chat',
      data: [message],
    })
  }

  get history(): string[] {
    return this._history
  }

  clear() {
    this._history = []
  }
}

export const chat = new Elysia({ prefix: '/chat' })
  .decorate('chat', new Chat())
  .post(
    '/',
    ({ body: message, chat }) => {
      chat.add(message)
      return chat.history
    },
    {
      body: t.String(),
      response: t.Array(t.String()),
    }
  )
