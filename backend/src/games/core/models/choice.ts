import { t } from 'elysia'

export class Choice {
  static t = t.Object({
    id: t.String(),
    text: t.String(),
  })

  id: string
  text: string

  constructor(id: string, text: string) {
    this.id = id
    this.text = text
  }
}
