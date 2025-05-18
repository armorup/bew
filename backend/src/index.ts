import {Elysia, t} from "elysia";
import {swagger} from "@elysiajs/swagger";
import {cors} from "@elysiajs/cors";

let notes: string[] = ["Moonhalo"];

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .ws("/chat", {
    body: t.String(),
    response: t.String(),
    open(ws) {
      ws.subscribe("chat-room");
      ws.publish("chat-room", "New user joined!");
    },
    message(ws, message) {
      ws.publish("chat-room", message);
    },
  })
  .listen(3000);

console.log(`🦊 Elysia is running at http://localhost:3000`);

export type App = typeof app;
