import { t } from 'elysia'
import { ChoiceType } from '../../../types/games'

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

  toJSON(): ChoiceType {
    return {
      id: this.id,
      text: this.text,
    }
  }
}
