import Elysia, {t} from "elysia";
import {wsService} from ".";

//------- Schema and types -------
const MessageEnum = {
  chat: "chat",
  todo: "todo",
} as const;

const wsSchema = {
  body: t.Object({
    channel: t.String(),
    type: t.Enum(MessageEnum),
    data: t.String(),
  }),
  response: t.Object({
    channel: t.String(),
    type: t.Enum(MessageEnum),
    data: t.String(),
  }),
  query: t.Object({
    channel: t.Optional(t.String({default: "lobby"})),
  }),
} as const;

export type WsSchema = typeof wsSchema.body.static;

//------- WebSocket Service -------
export class WebSocketService {
  constructor(private server: Elysia["server"]) {}

  broadcast(payload: typeof wsSchema.body.static) {
    this.server?.publish?.(payload.channel, JSON.stringify(payload));
  }
}

export const websocket = new Elysia().ws("/ws", {
  body: wsSchema.body,
  response: wsSchema.response,
  query: wsSchema.query,
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
