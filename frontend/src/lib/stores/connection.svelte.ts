import { browser } from '$app/environment'

export const connection = $state({
	connected: false,
	error: null as string | null
})

// User-related functions
export function setCookie(name: string, value: string, days = 365) {
	if (!browser) return
	const expires = new Date(Date.now() + days * 864e5).toUTCString()
	document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`
}

export function getCookie(name: string) {
	if (!browser) return undefined
	const value = document.cookie
		.split('; ')
		.find((row) => row.startsWith(name + '='))
		?.split('=')[1]
	return value ? decodeURIComponent(value) : undefined
}

export function clearCookie(name: string) {
	if (!browser) return
	document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}
