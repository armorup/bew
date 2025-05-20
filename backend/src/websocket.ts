import Elysia, {t} from "elysia";
import {wsService} from ".";

export const MessageEnum = {
  chat: "chat",
  todo: "todo",
} as const;

const wsBodySchema = t.Object({
  channel: t.Optional(t.String({default: "lobby"})),
  type: t.Enum(MessageEnum),
  data: t.Optional(t.String({default: ""})),
});

const wsResponseSchema = t.Object({
  channel: t.String(),
  type: t.Enum(MessageEnum),
  data: t.String(),
});

const wsQuerySchema = t.Object({
  channel: t.Optional(t.String({default: "lobby"})),
});

type broadcastPayloadSchema = typeof wsResponseSchema.static;

export class WebSocketService {
  constructor(private server: Elysia["server"]) {}

  broadcast(payload: broadcastPayloadSchema) {
    this.server?.publish?.(payload.channel, JSON.stringify(payload));
  }
}

export const websocket = new Elysia().ws("/ws", {
  body: wsBodySchema,
  response: wsResponseSchema,
  query: wsQuerySchema,
  open(ws) {
    const channel = ws.data?.query.channel || "lobby";
    ws.subscribe(channel);
    wsService.broadcast({
      channel,
      type: MessageEnum.chat,
      data: "New user joined!",
    });
  },
  message(ws, message) {},
});
