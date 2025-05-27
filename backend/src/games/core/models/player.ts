import { t } from 'elysia'
import { PlayerType } from '../../../types/games'

export class Player {
  static t = t.Object({
    id: t.String(),
    name: t.String(),
    vote: t.Optional(t.String()),
  })

  id: string
  name: string
  vote: string | undefined

  constructor(id: string, name: string) {
    this.id = id
    this.name = name
    this.vote = undefined
  }

  toJSON(): PlayerType {
    return {
      id: this.id,
      name: this.name,
      vote: this.vote,
    }
  }
}
