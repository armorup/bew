import { treaty } from '@elysiajs/eden';
import type { App, WsSchema } from '../../../backend/src/types.js';

export type { WsSchema };
export const api = treaty<App>('http://localhost:3000');
