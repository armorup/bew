import Elysia from 'elysia'
import { sse } from './sse'

export const gameSSE = new Elysia({ prefix: '/sse' }).get(
  '/',
  function* ({ set }) {
    set.headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    }

    // Create stream controller
    let controller: ReadableStreamDefaultController<string> | null = null

    // Initial game data
    const initialData = JSON.stringify(sse.getJoinableGames())
    yield `data: ${initialData}\n\n`

    try {
      // Keep connection open
      while (true) {
        // Create a promise that resolves on next broadcast
        yield new Promise<string>((resolve) => {
          controller = {
            enqueue: (data: string) => {
              resolve(data)
              controller = null
            },
            close: () => {},
            error: () => {},
          } as any

          if (controller) {
            sse.addConnection(controller)
          }
        })
      }
    } finally {
      // Clean up when connection closes
      if (controller) sse.removeConnection(controller)
    }
  }
)
