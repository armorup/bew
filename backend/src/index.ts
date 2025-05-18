import {Elysia, t} from "elysia";
import {swagger} from "@elysiajs/swagger";
import {cors} from "@elysiajs/cors";

let notes: string[] = ["Moonhalo"];

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .ws("/chat", {
    body: t.String(),
    response: t.Object({
      type: t.String(),
      data: t.String(),
    }),
    open(ws) {
      ws.subscribe("chat-room");
      ws.publish("chat-room", {type: "system", data: "New user joined!"});
    },
    message(ws, message) {
      ws.publish("chat-room", {type: "chat", data: message});
    },
  })
  .post(
    "/todo",
    ({body}) => {
      app.server?.publish?.(
        "chat-room",
        JSON.stringify({type: "todo", data: body.todo})
      );
      return {status: "ok"};
    },
    {
      body: t.Object({
        todo: t.String(),
      }),
    }
  )

  .listen(3000);

console.log(`🦊 Elysia is running at http://localhost:3000`);

export type App = typeof app;
