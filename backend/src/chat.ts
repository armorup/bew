import {Elysia, t} from "elysia";
import {app, wsService} from "./index";

class Chat {
  data: string[] = [];

  add(message: string) {
    this.data.push(message);
  }

  get() {
    return this.data;
  }

  clear() {
    this.data = [];
  }
}

export const chat = new Elysia().decorate("chat", new Chat()).post(
  "/chat",
  ({body: {message}, chat}) => {
    chat.add(message);
    wsService.broadcast({
      channel: "lobby",
      type: "chat",
      data: message,
    });
    return {status: "ok"};
  },
  {
    body: t.Object({
      message: t.String(),
    }),
  }
);
