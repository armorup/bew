import { t } from 'elysia'
import { Scene } from './scene'

export type StoryType = typeof Story.t.static
export class Story {
  static t = t.Object({
    id: t.String(),
    title: t.String(),
    scenes: t.Array(Scene.t),
  })

  id: string
  title: string
  scenes: Scene[]

  private constructor(story: StoryType) {
    this.id = story.id
    this.title = story.title
    this.scenes = story.scenes.map((scene) => Scene.fromJSON(scene))
  }

  static fromJSON(json: StoryType): Story {
    return new Story(json)
  }

  toJSON(): StoryType {
    return {
      id: this.id,
      title: this.title,
      scenes: this.scenes,
    }
  }
}
