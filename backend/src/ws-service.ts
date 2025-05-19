import {Elysia, t} from "elysia";

export const MessageEnum = {
  chat: "chat",
  todo: "todo",
} as const;

export const wsRequestSchema = t.Object({
  type: t.Enum(MessageEnum),
  channel: t.Optional(t.String({default: "lobby"})),
  data: t.Optional(t.String({default: ""})),
});

export const wsResponseSchema = t.Object({
  type: t.Enum(MessageEnum),
  data: t.String(),
  channel: t.String(),
});

export const wsQuerySchema = t.Object({
  channel: t.Optional(t.String({default: "lobby"})),
});

type broadcastPayloadSchema = typeof wsResponseSchema.static;

export class WebSocketService {
  constructor(private server: Elysia["server"]) {}

  broadcast(channel: string, payload: broadcastPayloadSchema) {
    this.server?.publish?.(channel, JSON.stringify(payload));
  }
}
