import { t } from 'elysia'
import { Scene } from './scene'

export class Story {
  static t = t.Object({
    id: t.String(),
    title: t.String(),
    scenes: t.Array(Scene.t),
  })

  id: string
  title: string
  scenes: Scene[]

  constructor(id: string, title: string, scenes: Scene[]) {
    this.id = id
    this.title = title
    this.scenes = scenes
  }
}
