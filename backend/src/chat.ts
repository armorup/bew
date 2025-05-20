import {Elysia, t} from "elysia";
import {wsService} from "./index";

class Chat {
  data: string[] = [];

  add(message: string) {
    this.data.push(message);
    wsService.broadcast({
      channel: "lobby",
      type: "chat",
      data: message,
    });
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
    return {status: "ok"};
  },
  {
    body: t.Object({
      message: t.String(),
    }),
  }
);
