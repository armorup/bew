import { cors } from '@elysiajs/cors'
import { Elysia, t } from 'elysia'
import { createClient } from 'redis'

// Create Redis clients
const redisSubscriber = createClient({ url: 'redis://localhost:6379' })
const redisPublisher = createClient({ url: 'redis://localhost:6379' })

// Connect clients
await Promise.all([redisSubscriber.connect(), redisPublisher.connect()])

const ALLOWED_ORIGIN = 'http://localhost:5173'

export const sse = new Elysia()
  .state({ msgQueue: [] as string[] })
  .use(
    cors({
      origin: ALLOWED_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
      exposeHeaders: ['Content-Type'],
      preflight: true,
    })
  )
  .get('/sse', async function* ({ set, request, store }) {
    // Set SSE headers
    // Manually set SSE-specific headers
    set.headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      // 'Access-Control-Allow-Credentials': 'true',
    }

    // Message buffer and cleanup tracker
    let isAborted = false

    // Redis message handler
    const handleMessage = (message: string) => {
      console.log('Message received from Redis:', message)
      if (!isAborted) {
        store.msgQueue.push(`data: ${message}\n\n`)
      }
    }

    // Subscribe to Redis channel
    await redisSubscriber.subscribe('notifications', handleMessage)

    // Cleanup on client disconnect
    request.signal.addEventListener('abort', () => {
      isAborted = true
      redisSubscriber.unsubscribe('notifications', handleMessage)
    })

    // Add heartbeat
    const heartbeat = setInterval(() => {
      if (!isAborted) store.msgQueue.push(':heartbeat\n')
    }, 9000)

    try {
      // Stream messages to client
      while (!isAborted) {
        if (store.msgQueue.length > 0) {
          const msg = store.msgQueue.shift()
          console.log('store.msgQueue.shift()', msg)
          yield msg!
        } else {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }
    } finally {
      clearInterval(heartbeat)
      redisSubscriber.unsubscribe('notifications', handleMessage)
    }
  })
  .post(
    '/sse/send',
    async ({ body }) => {
      const { message } = body
      await redisPublisher.publish('notifications', message)
      console.log('Message sent to Redis:', message)
      return { success: true }
    },
    {
      body: t.Object({
        message: t.String(),
      }),
    }
  )

console.log('Server running at http://localhost:3000')
