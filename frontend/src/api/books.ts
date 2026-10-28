import { client } from "./client";
export const getBooks = (params?: object) =>
  client.get("/books", { params }).then((r) => r.data);
export const getBook = (id: string) =>
  client.get(`/books/${id}`).then((r) => r.data);
export const createBook = (dto: object) =>
  client.post("/books", dto).then((r) => r.data);
