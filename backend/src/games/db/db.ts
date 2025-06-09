import stories from './stories.json'
import { Story } from '../../models/models'

// Ex: story-1
export function loadStory(storyId: string = 'story-1'): Story {
  const story = stories.find((s) => s.id === storyId) as unknown as Story
  if (!story) throw new Error('Story not found')
  return story
}
