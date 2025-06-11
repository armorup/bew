# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (Bun + Elysia)
- `cd backend && bun run dev` - Start backend development server with hot reload
- `cd backend && bun test` - Run all backend tests using Bun's test runner
- `cd backend && bun test --watch` - Run tests in watch mode
- Backend runs on http://localhost:3000

### Frontend (SvelteKit)
- `cd frontend && npm run dev` - Start frontend development server
- `cd frontend && npm run build` - Build for production
- `cd frontend && npm run lint` - Run ESLint and Prettier checks
- `cd frontend && npm run check` - Run Svelte type checking
- `cd frontend && npm run test` - Run unit tests and e2e tests
- `cd frontend && npm run test:unit` - Run Vitest unit tests only
- `cd frontend && npm run test:e2e` - Run Playwright e2e tests only

## Architecture Overview

This is a real-time multiplayer story-based game platform with a full-stack TypeScript architecture.

### Backend Structure (Elysia + Bun)
- **Entry Point**: `backend/src/index.ts` - Main server setup with CORS, Swagger, and route registration
- **Real-time Communication**: WebSocket-based using `RealtimeManager` class for channel subscriptions and message broadcasting
- **Games Management**: Singleton `GamesManager` handles game state, player management, and game lifecycle
- **Type Safety**: Comprehensive schemas using Elysia's `t` utility for runtime validation and TypeScript types

### Frontend Structure (SvelteKit)
- **API Layer**: Type-safe client using `@elysiajs/eden` treaty pattern for backend communication
- **Real-time Client**: `RealtimeClient` singleton manages WebSocket connections and message routing
- **State Management**: Svelte 5 runes (`$state`) for reactive game and lobby state
- **Routing**: SvelteKit file-based routing with dynamic game pages at `/games/[id]`

### Key Integration Points
1. **Type Sharing**: Backend schemas generate TypeScript types consumed by frontend
2. **Real-time Messaging**: Unified `WSMessage` type system for chat, todos, game updates, and player management
3. **User Management**: Cookie-based session management with guest user creation
4. **Game Lifecycle**: Games auto-cleanup after 24 hours, support waiting/active status transitions

### Message Flow
- Backend `RealtimeManager` broadcasts typed messages to WebSocket channels
- Frontend `RealtimeClient` routes messages to appropriate state managers (lobby, game, chat)
- Game state updates broadcast automatically when players join/leave or game progresses

### Data Models
- **Games**: ID-based with scenes, choices, players, and voting mechanics
- **Players**: ID, name, and optional vote for scene progression
- **Stories**: JSON-based story data with branching narrative structure