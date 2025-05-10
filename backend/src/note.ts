import {Elysia, t} from "elysia";

class Note {
  constructor(public data: string[] = ["Moonhalo"]) {}

  add(note: string) {
    this.data.push(note);
    return this.data;
  }

  remove(index: number) {
    return this.data.splice(index, 1);
  }

  update(index: number, note: string) {
    return (this.data[index] = note);
  }
}

export const note = new Elysia({prefix: "/note"})
  .decorate("note", new Note())
  .get("/", ({note}) => note.data)
  .get(
    "/:index",
    ({note, params: {index}, status}) => {
      return note.data[index] ?? status(404, "Not Found :(");
    },
    {
      params: t.Object({
        index: t.Number(),
      }),
    }
  )
  .put("/", ({note, body: {data}}) => note.add(data), {
    body: t.Object({data: t.String()}),
  })
  .patch(
    "/:index",
    ({note, params: {index}, body: {data}, status}) => {
      if (index in note.data) return note.update(index, data);
      return status(422);
    },
    {
      params: t.Object({index: t.Number()}),
      body: t.Object({data: t.String()}),
    }
  )
  .delete(
    "/:index",
    ({note, params: {index}, status}) => {
      if (index in note.data) return note.remove(index);
      return status(422);
    },
    {
      params: t.Object({index: t.Number()}),
    }
  );
