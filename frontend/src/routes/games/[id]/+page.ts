import type { PageLoad } from './$types'
import { api } from '$lib/app/api'

export const load: PageLoad = async ({ params }) => {
	const res = await api.games({ id: params.id }).get()
	if (res.status !== 200) throw new Error('Game not found')

	if (!res.data?.currentScene) {
		throw new Error('Invalid game data structure')
	}
	console.log(res.data?.id)
	return res.data
}
