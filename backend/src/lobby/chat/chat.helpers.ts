import { type Chat, type ChatMsg } from './chat.schemas'

export function createChat(text: string): Chat {
  return {
    id: crypto.randomUUID(),
    text,
  }
}

export function createChatMsg(chat: Chat): ChatMsg {
  return {
    type: 'chat',
    data: chat,
  }
}
