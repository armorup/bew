import { GameStatus } from './game.enums'
import { loadStory } from '../db/db'
import type { Game, GameJoinable, GameMsg, Player } from './games.schemas'

export function createNewGame(): Game {
  const story = loadStory()
  const firstScene = story.scenes[0]
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    currentScene: firstScene,
    isOver: false,
    players: [],
    maxPlayers: 4,
    status: GameStatus.WAITING, // use the correct enum value
  }
}

export function createPlayer(playerName: string): Player {
  return {
    id: crypto.randomUUID(),
    name: playerName,
  }
}

export function addPlayer(game: Game, player: Player): Game {
  if (game.players.some((p) => p.id === player.id)) {
    throw new Error('Player already exists')
  }
  return { ...game, players: [...game.players, player] }
}
export function toGameJoinable(game: Game): GameJoinable {
  return {
    id: game.id,
    createdAt: game.createdAt,
    playerCount: game.players.length,
    maxPlayers: game.maxPlayers,
  }
}

export function createGameMsg(game: Game): GameMsg {
  return {
    type: 'game',
    data: game,
  }
}
