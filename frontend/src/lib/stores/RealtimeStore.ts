// src/lib/stores/RealtimeStore.ts
import { writable, derived } from 'svelte/store'
import { api } from '$lib/shared.js'
import { browser } from '$app/environment'

// User-related functions
function setCookie(name: string, value: string, days = 365) {
	if (!browser) return
	const expires = new Date(Date.now() + days * 864e5).toUTCString()
	document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`
}

function getCookie(name: string) {
	if (!browser) return undefined
	const value = document.cookie
		.split('; ')
		.find((row) => row.startsWith(name + '='))
		?.split('=')[1]
	return value ? decodeURIComponent(value) : undefined
}

function clearCookie(name: string) {
	if (!browser) return
	document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

// Create stores
export const connected = writable(false)
export const messages = writable<string[]>([])
export const todos = writable<string[]>([])
export const playerId = writable<string | undefined>(browser ? getCookie('playerId') : undefined)
export const playerName = writable<string | undefined>(
	browser ? getCookie('playerName') : undefined
)
export const error = writable<string | null>(null)

// Websocket reference
let ws: ReturnType<(typeof api)['ws']['subscribe']> | null = null

// Ensure we have a user
async function ensureUser(): Promise<boolean> {
	let currentPlayerId = getCookie('playerId')
	let currentPlayerName = getCookie('playerName')

	if (!currentPlayerId || !currentPlayerName) {
		try {
			const res = await api.user.guest.get()
			if (!res) throw new Error('Failed to fetch user')

			const data = res.data
			if (!data || !data.id || !data.name) throw new Error('Invalid user data')

			currentPlayerId = data.id
			currentPlayerName = data.name

			setCookie('playerId', currentPlayerId)
			setCookie('playerName', currentPlayerName)

			playerId.set(currentPlayerId)
			playerName.set(currentPlayerName)

			return true
		} catch (err) {
			error.set('Unable to create user. Please try again later.')
			return false
		}
	}

	playerId.set(currentPlayerId)
	playerName.set(currentPlayerName)
	return true
}

// Connect to websocket
export async function connect() {
	if (ws) return // Already connected

	const userCreated = await ensureUser()
	if (!userCreated) return

	ws = api.ws.subscribe()

	ws.on('open', () => {
		console.log('Connected to chat room as', getCookie('playerName'), getCookie('playerId'))
		connected.set(true)
	})

	ws.subscribe((message) => {
		const { channel, type, data } = message.data
		console.log(type, data, channel)

		if (type === 'todo') {
			todos.update((currentTodos) => [...currentTodos, data])
		} else if (type === 'chat') {
			messages.update((currentMessages) => [...currentMessages, data])
		}
	})

	ws.on('close', () => {
		console.log('Disconnected')
		connected.set(false)
	})
}

// Send a chat message
export function sendMessage(message: string) {
	if (!message.trim()) return
	api.chat.post({ message })
}

// Send a todo
export async function sendTodo(todo: string) {
	if (!todo.trim()) return
	await api.todo.post({ todo })
}

// Disconnect
export function disconnect() {
	if (ws) {
		ws.close()
		ws = null
		connected.set(false)
	}
}

// Initialize on import (if in browser)
if (browser) {
	connect()
}
