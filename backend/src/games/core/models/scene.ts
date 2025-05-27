import { t } from 'elysia'
import { Choice } from './choice'
import { SceneType } from '../../../types/games'

export class Scene {
  static t = t.Object({
    id: t.String(),
    title: t.String(),
    text: t.String(),
    choices: t.Array(Choice.t),
  })

  id: string
  title: string
  text: string
  choices: Choice[]

  constructor(id: string, title: string, text: string, choices: Choice[]) {
    this.id = id
    this.title = title
    this.text = text
    this.choices = choices
  }

  toJSON(): SceneType {
    return {
      id: this.id,
      title: this.title,
      text: this.text,
      choices: this.choices,
    }
  }
}
