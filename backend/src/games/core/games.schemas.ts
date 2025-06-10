import { t } from 'elysia'
import { GameStatus } from './game.enums'

export const playerSchema = t.Object({
  id: t.String(),
  name: t.String(),
  vote: t.Optional(t.String()),
})

export const playersSchema = t.Array(playerSchema)

export const choiceSchema = t.Object({
  id: t.String(),
  text: t.String(),
})

export const sceneSchema = t.Object({
  id: t.String(),
  title: t.String(),
  text: t.String(),
  choices: t.Array(choiceSchema),
})

export const storySchema = t.Object({
  id: t.String(),
  title: t.String(),
  scenes: t.Array(sceneSchema),
})

export const gameJoinable = t.Object({
  id: t.String(),
  createdAt: t.String(),
  playerCount: t.Number(),
  maxPlayers: t.Number(),
})

export const gameSchema = t.Object({
  id: t.String(),
  createdAt: t.String(),
  currentScene: sceneSchema,
  isOver: t.Boolean(),
  players: t.Array(playerSchema),
  maxPlayers: t.Number(),
  status: t.Enum(GameStatus),
})

export const gameMsgSchema = t.Object({
  type: t.Literal('game'),
  data: gameSchema,
})
// Message schemas
export const playerMsgSchema = t.Object({
  type: t.Literal('player'),
  data: playerSchema,
})

export const playersMsgSchema = t.Object({
  type: t.Literal('players'),
  data: t.Array(playerSchema),
})

export const gameJoinableMsgSchema = t.Object({
  type: t.Literal('game.joinable'),
  data: gameJoinable,
})

export const gameUpdateMsgSchema = t.Object({
  type: t.Literal('game.update'),
  data: gameSchema,
})

// Generated types
export type Player = typeof playerSchema.static
export type Players = typeof playersSchema.static
export type Choice = typeof choiceSchema.static
export type Scene = typeof sceneSchema.static
export type Story = typeof storySchema.static
export type GameJoinable = typeof gameJoinable.static
export type Game = typeof gameSchema.static

export type PlayerMsg = typeof playerMsgSchema.static
export type PlayersMsg = typeof playersMsgSchema.static
export type GameJoinableMsg = typeof gameJoinableMsgSchema.static
export type GameUpdateMsg = typeof gameUpdateMsgSchema.static
export type GameMsg = typeof gameMsgSchema.static
