import { t } from 'elysia'

export const TODO_SCHEMA = t.Object({
  id: t.String(),
  text: t.String(),
})
