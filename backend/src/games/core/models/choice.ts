import { t } from 'elysia'

export type ChoiceType = typeof Choice.t.static

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
