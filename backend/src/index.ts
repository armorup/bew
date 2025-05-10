import {Elysia} from "elysia";
import {swagger} from "@elysiajs/swagger";
import {cors} from "@elysiajs/cors";
import {note} from "./note";

const app = new Elysia().use(cors()).use(swagger()).use(note).listen(3000);

console.log(`🦊 Elysia is running at http://localhost:3000`);
