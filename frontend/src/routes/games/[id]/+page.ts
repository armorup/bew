import type { PageLoad } from './$types'
import { api } from '$lib/app/api'

export const load: PageLoad = async ({ params }) => {
	const res = await api.games({ id: params.id }).get()
	console.log('Game loaded', res.data)
	if (res.status !== 200) throw new Error('Game not found')
	return res.data
}
