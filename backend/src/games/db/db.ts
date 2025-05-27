import stories from './stories.json'
import { StoryType } from '../../types/games'

// Ex: story-1
export function loadStory(storyId: string = 'story-1'): StoryType {
  return stories.find((s) => s.id === storyId) as StoryType
}
