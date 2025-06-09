import { t } from 'elysia'

export const todoSchema = t.Object({
  id: t.String(),
  text: t.String(),
})

export const chatSchema = t.Object({
  id: t.String(),
  text: t.String(),
})
