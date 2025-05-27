import { Choice } from '../games/core/models/choice'
import { Game } from '../games/core/models/game'
import { Player } from '../games/core/models/player'
import { Scene } from '../games/core/models/scene'
import { Story } from '../games/core/models/story'

export type GameType = typeof Game.t.static
export type PlayerType = typeof Player.t.static
export type SceneType = typeof Scene.t.static
export type StoryType = typeof Story.t.static
export type ChoiceType = typeof Choice.t.static
