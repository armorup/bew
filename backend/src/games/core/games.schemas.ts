import { t } from 'elysia'
import { GameStatus } from './game.enums'

export const playerSchema = t.Object({
  id: t.String(),
  name: t.String(),
  vote: t.Optional(t.String()),
})

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
  players: t.Array(playerSchema),
  maxPlayers: t.Number(),
  status: t.Enum(GameStatus),
})
// ========================
// Export to join models
// ========================
// export const gameSchemas = {
//   player: playerSchema,
//   scene: sceneSchema,

// }
