import { api } from '$lib/app/api'
import { realtimeManager } from '$lib/realtime/realtime.svelte'
import type { Chat, Todo } from '../../../../backend/src/models/models'
export class Lobby {
	state = $state({
		chatMessages: [] as Chat[],
		todos: [] as Todo[]
	})

	private static _instance: Lobby
	static instance() {
		return this._instance || (this._instance = new Lobby())
	}

	updateChat() {
		api.lobby.chat.get().then(({ data }) => {
			lobby.state.chatMessages = data || []
		})
	}
	// Send a chat message
	addChatMessage(message: string) {
		if (!message.trim()) return
		api.lobby.chat.create.post({ data: message })
	}

	updateTodos() {
		api.lobby.todo.get().then(({ data }) => {
			lobby.state.todos = data || []
		})
	}

	// Add a todo and send to server
	addTodo(text: string) {
		// lobby.state.todos.push(createTodo(text))
		api.lobby.todo.create.post({ todo: text })
	}
}

export const lobby = Lobby.instance()
