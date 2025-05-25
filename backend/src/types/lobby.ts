import { t } from 'elysia'

export const todoSchema = t.Object({
  todo: t.String(),
})

export type Todo = typeof todoSchema.static
