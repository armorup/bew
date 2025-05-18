// frontend/src/lib/note.ts
export class Note {
	constructor(public data: string) {}

	// Add methods or getters as needed
	get uppercased() {
		return this.data.toUpperCase();
	}
}
