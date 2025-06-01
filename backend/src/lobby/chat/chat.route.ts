import { Elysia, t } from 'elysia'
import { realtimeManager } from '../../index'
import { Message } from '../../realtime/realtime.message'

class Chat {
  private _history: string[] = []

  add(message: string) {
    this._history.push(message)
    realtimeManager.broadcast('lobby', Message.chat(message))
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
    ({ body: { data }, chat }) => {
      chat.add(data)
      return chat.history
    },
    {
      body: Message.t.chat.body,
      response: t.Array(t.String()),
    }
  )
