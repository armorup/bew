import { treaty } from '@elysiajs/eden'
import type { App } from '../../../../backend/src/types/app.js'

export const api = treaty<App>('http://localhost:3000')
