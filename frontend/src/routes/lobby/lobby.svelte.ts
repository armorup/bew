import { api } from '$lib/app/api'

export class Lobby {
	state = $state({
		messages: [] as string[],
		todos: [] as string[]
	})

	private static _instance: Lobby
	static instance() {
		return this._instance || (this._instance = new Lobby())
	}

	// Send a chat message
	sendMessage(message: string) {
		if (!message.trim()) return
		api.chat.post(message)
	}

	// Send a todo
	sendTodo(todo: string) {
		if (!todo.trim()) return
		api.todo.post({ todo })
	}
}

export const lobby = Lobby.instance()
