import Elysia, {t} from "elysia";
import {wsService} from ".";

export const todo = new Elysia().post(
  "/todo",
  ({body: {todo}}) => {
    wsService.broadcast("lobby", {
      type: "todo",
      data: todo,
      channel: "lobby",
    });
    return {status: "ok"};
  },
  {
    body: t.Object({
      todo: t.String(),
    }),
  }
);
