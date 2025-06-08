import { t } from 'elysia'

export const CHAT_SCHEMA = t.Object({
  id: t.String(),
  text: t.String(),
})
