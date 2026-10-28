import { client } from "./client";
export const getLoans = (params?: object) =>
  client.get("/loans", { params }).then((r) => r.data);
export const createLoan = (dto: object) =>
  client.post("/loans", dto).then((r) => r.data);
export const returnLoan = (id: string) =>
  client.post(`/loans/${id}/return`).then((r) => r.data);
export const renewLoan = (id: string) =>
  client.post(`/loans/${id}/renew`).then((r) => r.data);
