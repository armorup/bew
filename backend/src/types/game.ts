import { t } from 'elysia'

// Types
export const playerSchema = t.Object({
  id: t.String(),
  name: t.String(),
  vote: t.String(),
})
export type Player = typeof playerSchema.static

export const choiceSchema = t.Object({
  id: t.String(),
  text: t.String(),
})
type Choice = typeof choiceSchema.static

export const sceneSchema = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.String(),
  choices: t.Array(choiceSchema),
})
export type Scene = typeof sceneSchema.static

export const storySchema = t.Object({
  id: t.String(),
  title: t.String(),
  scenes: t.Array(sceneSchema),
})

export type Story = typeof storySchema.static
