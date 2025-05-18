import {Elysia, t} from "elysia";
import {swagger} from "@elysiajs/swagger";
import {cors} from "@elysiajs/cors";
import {websocket} from "./websocket";

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .use(websocket)
  .post(
    "/chat",
    ({body}) => {
      app.server?.publish?.(
        "lobby",
        JSON.stringify({type: "chat", data: body.message, channel: "lobby"})
      );
      return {status: "ok"};
    },
    {
      body: t.Object({message: t.String()}),
    }
  )
  .post(
    "/todo",
    ({body}) => {
      app.server?.publish?.(
        "lobby",
        JSON.stringify({type: "todo", data: body.todo, channel: "lobby"})
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
