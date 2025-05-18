import {Elysia, t} from "elysia";
import {app} from "./index";

export const chat = new Elysia().post(
  "/chat",
  ({body}) => {
    app.server?.publish?.(
      "lobby",
      JSON.stringify({type: "chat", data: body.message, channel: "lobby"})
    );
    return {status: "ok"};
  },
  {
    body: t.Object({
      message: t.String(),
    }),
  }
);
