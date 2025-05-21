import { treaty } from '@elysiajs/eden'
import type { App, MessageSchema } from '../../../backend/src/types.js'

export const api = treaty<App>('http://localhost:3000')
