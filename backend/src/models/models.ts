import { t } from 'elysia'
import {
  chatMsgSchema,
  todoMsgSchema,
  playersMsgSchema,
  gameMsgSchema,
} from './types'
import type { TodoMsg, ChatMsg, GameMsg, PlayersMsg } from './types'

export const messageSchema = t.Union([
  todoMsgSchema,
  chatMsgSchema,
  gameMsgSchema,
  playersMsgSchema,
])

export type WSMessage = TodoMsg | ChatMsg | GameMsg | PlayersMsg
