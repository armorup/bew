import { t } from 'elysia'

// Types

export const choiceSchema = t.Object({
  id: t.String(),
  text: t.String(),
})

export const playerSchema = t.Object({
  id: t.String(),
  name: t.String(),
  vote: t.Optional(t.String()),
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

export type Choice = typeof choiceSchema.static
export type Player = typeof playerSchema.static
export type Scene = typeof sceneSchema.static
export type Story = typeof storySchema.static
