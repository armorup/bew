import { t } from 'elysia'
import { Scene } from './scene'
import { StoryType } from '../../../types/games'

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

  toJSON(): StoryType {
    return {
      id: this.id,
      title: this.title,
      scenes: this.scenes,
    }
  }
}
