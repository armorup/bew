import stories from './stories.json'
import type { Story, Story as StoryType } from '../../types/game'

// Ex: story-1
export function loadStory(storyId: string = 'story-1'): Story {
  const story: Story = stories.find((s) => s.id === storyId) as Story
  return story
}
