// @ts-expect-error bun:test is provided by Bun at runtime
import { describe, expect, it, beforeEach } from 'bun:test'
import { game } from './game'

function makeUrl(path: string) {
  return `http://localhost/game${path}`
}

describe('Game API', () => {
  beforeEach(() => {
    // Reset the game before each test
    game.handle(new Request(makeUrl('/reset'), { method: 'POST' }))
  })

  it('should return the initial scene', async () => {
    const res = await game.handle(new Request(makeUrl('/')))
    const data = await res.json()
    expect(data.scene).toBeDefined()
    expect(data.scene.title).toBe('A Fork in the Road')
  })

  it('should allow a player to join', async () => {
    const res = await game.handle(
      new Request(makeUrl('/join'), {
        method: 'POST',
        body: JSON.stringify({ playerId: 'p1' }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.players).toContain('p1')
  })

  it('should allow a player to vote and progress the scene', async () => {
    // Join as p1
    await game.handle(
      new Request(makeUrl('/join'), {
        method: 'POST',
        body: JSON.stringify({ playerId: 'p1' }),
        headers: { 'content-type': 'application/json' },
      })
    )
    // Vote as p1
    const voteRes = await game.handle(
      new Request(makeUrl('/vote'), {
        method: 'POST',
        body: JSON.stringify({ playerId: 'p1', choiceId: 'left' }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const voteData = await voteRes.json()
    expect(voteData.ok).toBe(true)
    expect(voteData.votes['p1']).toBe('left')
    // After voting, scene should progress
    expect(voteData.scene.id).not.toBe('scene-1')
  })

  it('should reset the game', async () => {
    // Join as p1
    await game.handle(
      new Request(makeUrl('/join'), {
        method: 'POST',
        body: JSON.stringify({ playerId: 'p1' }),
        headers: { 'content-type': 'application/json' },
      })
    )
    // Reset
    const resetRes = await game.handle(
      new Request(makeUrl('/reset'), { method: 'POST' })
    )
    const resetData = await resetRes.json()
    expect(resetData.ok).toBe(true)
    // Should have no players after reset
    const res = await game.handle(new Request(makeUrl('/')))
    const data = await res.json()
    expect(data.votes).toEqual({})
  })
})
