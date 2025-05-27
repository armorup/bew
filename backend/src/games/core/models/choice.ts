import { t } from 'elysia'
import type { ChoiceType } from '../../../types/games'

export class Choice {
  static t = t.Object({
    id: t.String(),
    text: t.String(),
  })

  id: string
  text: string

  private constructor(choice: ChoiceType) {
    this.id = choice.id
    this.text = choice.text
  }

  static fromJSON(json: ChoiceType): Choice {
    return new Choice(json)
  }

  toJSON(): ChoiceType {
    return {
      id: this.id,
      text: this.text,
    }
  }
}
