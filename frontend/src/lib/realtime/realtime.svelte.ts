import { api } from '$lib/app/api.js'
import { browser } from '$app/environment'
import { lobby } from '../../routes/lobby/lobby.svelte'
import { player } from '../util/game.svelte'
import { getCookie, setCookie, clearCookie } from '../util/browser'
import { gameState } from '../util/game.svelte'

// Create reactive state class
class RealtimeClient {
	connection = $state({
		connected: false,
		error: null as string | null
	})
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
				this.connection.error = 'Unable to create user. Please try again later.'
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
			this.connection.connected = true
		})

		this.ws.subscribe((message) => {
			const { type, data } = message.data
			console.log(`subscribe msg: ${type} - ${data}`)
			switch (type) {
				case 'chat':
					lobby.state.chatMessages.push(data)
					break
				case 'todo':
					lobby.state.todos.push(data)
					break
			}
		})

		this.ws.on('message', (message) => {
			const { type, data } = message.data
			console.log(`message msg: ${type} - ${data}`)
		})

		this.ws.on('close', () => {
			console.log('Disconnected')
			this.connection.connected = false
		})
	}

	// Disconnect
	disconnect() {
		if (this.ws) {
			this.ws.close()
			this.ws = null
			this.connection.connected = false
		}
	}

	// Clear error
	clearError() {
		this.connection.error = null
	}

	// Clear all messages
	clearMessages() {
		lobby.state.chatMessages.length = 0
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
export const realtimeManager = new RealtimeClient()

// Initialize on import (if in browser)
if (browser) {
	realtimeManager.connect()
}
