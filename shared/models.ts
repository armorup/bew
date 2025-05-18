import {t} from "elysia";

export const wsRequestSchema = t.Object({
  type: t.String(),
  channel: t.Optional(t.String({default: "lobby"})),
  data: t.Optional(t.String({default: ""})),
});

export const wsResponseSchema = t.Object({
  type: t.String(),
  data: t.String(),
  channel: t.String(),
});

export const wsQuerySchema = t.Object({
  channel: t.Optional(t.String({default: "lobby"})),
});
