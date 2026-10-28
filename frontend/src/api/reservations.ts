import { client } from "./client";
export const getReservations = (params?: object) =>
  client.get("/reservations", { params }).then((r) => r.data);
export const createReservation = (dto: object) =>
  client.post("/reservations", dto).then((r) => r.data);
export const cancelReservation = (id: string) =>
  client.post(`/reservations/${id}/cancel`).then((r) => r.data);
