import Elysia, {t} from "elysia";
import {
  wsRequestSchema,
  wsQuerySchema,
  wsResponseSchema,
} from "../../shared/models";

export const websocket = new Elysia().ws("/ws", {
  body: wsRequestSchema,
  response: wsResponseSchema,
  query: wsQuerySchema,
  open(ws) {
    const channel = ws.data?.query.channel || "lobby";
    ws.subscribe(channel);
    ws.publish(channel, wsResponseSchema.static);
  },
  close(ws) {
    // Optionally handle unsubscribe logic
    // ws.unsubscribe(channel); // You'd need to track which channel the ws is in
  },
  message(ws, message) {
    // message: { type, channel, data }
    // const channel = message.channel || "lobby";
    // const type = message.type || "chat";
    // const data = message.data || "";
    // ws.publish(channel, {type: type, data: data, channel});
  },
});
