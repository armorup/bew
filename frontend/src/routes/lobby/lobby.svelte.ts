import { api } from '$lib/app/api'
import type { Chat, Todo } from '../../../../backend/src/models/types'
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
	addChatMessage(text: string) {
		if (!text.trim()) return
		api.lobby.chat.create.post({ text })
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
