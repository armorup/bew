import { treaty } from '@elysiajs/eden';
import type { App } from '../../../backend/src/index.ts';

export const api = treaty<App>('http://localhost:3000');
