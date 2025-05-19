import Elysia, {t} from "elysia";
import {app} from ".";

export const todo = new Elysia().post(
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
);
