import type { api } from '$lib/api/app'

export type Player = { id: string; name: string; vote: string | null }

export type GameType = Awaited<ReturnType<typeof api.game.get>>['data']
