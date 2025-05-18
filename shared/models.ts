import {t} from "elysia";

export const noteSchema = t.Object({
  data: t.String(),
});

export type Note = {
  data: string;
};
