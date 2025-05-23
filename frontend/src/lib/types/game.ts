import type { api } from '$lib/app/api'

export type Game = NonNullable<Awaited<ReturnType<typeof api.game.get>>['data']>

export type Player = NonNullable<Awaited<ReturnType<typeof api.game.player.get>>['data']>

export type Scene = NonNullable<Game['scene']>

export type Choice = NonNullable<Scene['choices']>[number]

export type Vote = NonNullable<Game['votes']>[number]
