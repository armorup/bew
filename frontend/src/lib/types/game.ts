import type { api } from '$lib/app/api'

export type Game = NonNullable<Awaited<ReturnType<typeof api.games.get>>['data']>

// export type Player = NonNullable<Awaited<ReturnType<typeof api.games.player.get>>['data']>

export type Scene = NonNullable<Game[number]['currentScene']>

export type Choice = NonNullable<Scene['choices']>[number]

// export type Vote = NonNullable<Game['votes']>[number]
