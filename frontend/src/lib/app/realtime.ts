// src/lib/stores/RealtimeStore.svelte.ts
import { api } from '$lib/app/api.js'
import { browser } from '$app/environment'
import { lobby } from '../stores/lobby.svelte'
import { player } from '../stores/game.svelte'
import { connection } from '../stores/connection.svelte'
import { getCookie, setCookie, clearCookie } from '../stores/connection.svelte'
import { gameState } from '../stores/game.svelte'
import type { Player } from '../types/game'

// Create reactive state class
class Realtime {
	// Websocket reference
	private ws: ReturnType<(typeof api)['ws']['subscribe']> | null = null

	// Ensure we have a user
	async ensureUser(): Promise<boolean> {
		let playerId = getCookie('playerId')
		let playerName = getCookie('playerName')

		if (!playerId || !playerName) {
			try {
				const res = await api.user.guest.get()
				if (!res) throw new Error('Failed to fetch user')

				const data = res.data
				if (!data || !data.id || !data.name) throw new Error('Invalid user data')

				playerId = data.id
				playerName = data.name

				setCookie('playerId', playerId!)
				setCookie('playerName', playerName!)

				player.id = playerId
				player.name = playerName

				return true
			} catch (err) {
				connection.error = 'Unable to create user. Please try again later.'
				return false
			}
		}

		player.id = playerId
		player.name = playerName
		return true
	}

	// Connect to websocket
	async connect() {
		if (this.ws) return // Already connected

		const userCreated = await this.ensureUser()
		if (!userCreated) return

		this.ws = api.ws.subscribe()

		this.ws.on('open', () => {
			console.log('Connected to chat room as', getCookie('playerName'), getCookie('playerId'))
			connection.connected = true
		})

		this.ws.subscribe((message) => {
			const { channel, type, data } = message.data
			console.log(type, data, channel)

			if (type === 'todo') {
				lobby.todos.push(data)
			} else if (type === 'chat') {
				lobby.messages.push(data)
			}
		})

		this.ws.on('close', () => {
			console.log('Disconnected')
			connection.connected = false
		})
	}

	// Send a chat message
	sendMessage(message: string) {
		if (!message.trim()) return
		api.chat.post({ message })
	}

	// Send a todo
	async sendTodo(todo: string) {
		if (!todo.trim()) return
		await api.todo.post({ todo })
	}

	// Disconnect
	disconnect() {
		if (this.ws) {
			this.ws.close()
			this.ws = null
			connection.connected = false
		}
	}

	// Clear error
	clearError() {
		connection.error = null
	}

	// Add message manually (useful for local echo)
	addMessage(message: string) {
		lobby.messages.push(message)
	}

	// Add todo manually
	addTodo(todo: string) {
		lobby.todos.push(todo)
	}

	// Clear all messages
	clearMessages() {
		lobby.messages.length = 0
	}

	// Clear all todos
	clearTodos() {
		lobby.todos.length = 0
	}

	// Update game players
	updateGamePlayers(players: Array<Player>) {
		gameState.players = players
	}

	// Update current scene
	updateCurrentScene(scene: {
		id: string
		text: string
		options: Array<{ id: string; text: string }>
	}) {
		gameState.scene = scene
	}

	// Logout user
	logout() {
		clearCookie('playerId')
		clearCookie('playerName')
		player.id = ''
		player.name = ''
		this.disconnect()
	}
}

// Create and export the singleton instance
export const realtime = new Realtime()

// Initialize on import (if in browser)
if (browser) {
	realtime.connect()
}

// Export individual methods for convenience (optional)
export const { connect, disconnect, sendMessage, sendTodo, ensureUser } = realtime
