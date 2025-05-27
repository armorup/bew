import stories from './stories.json'
import { Story } from '../core/models/story'
import { StoryType } from '../../types/games'

// Ex: story-1
export function loadStory(storyId: string = 'story-1'): Story {
  const storyJSON = stories.find(
    (s) => s.id === storyId
  ) as unknown as StoryType
  if (!storyJSON) throw new Error('Story not found')
  return Story.fromJSON(storyJSON)
}
