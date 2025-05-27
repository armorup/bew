import { t } from 'elysia'
import { Choice } from './choice'
import type { SceneType } from '../../../types/games'

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

  private constructor(scene: SceneType) {
    this.id = scene.id
    this.title = scene.title
    this.text = scene.text.replace(/\\n/g, '\n')
    this.choices = scene.choices.map((choice) => Choice.fromJSON(choice))
  }

  static fromJSON(json: SceneType): Scene {
    return new Scene(json)
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
