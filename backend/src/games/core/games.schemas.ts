import { t } from 'elysia'

export const playerSchema = t.Object({
  id: t.String(),
  name: t.String(),
  vote: t.Optional(t.String()),
})

export const sceneSchema = t.Object({
  id: t.String(),
  name: t.String(),
  players: t.Array(playerSchema),
})

// ========================
// Export to join models
// ========================
export const gameSchemas = {
  player: playerSchema,
  scene: sceneSchema,
}
