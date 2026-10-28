import { client } from "./client";
export const getFines = (params?: object) =>
  client.get("/fines", { params }).then((r) => r.data);
export const payFine = (loanId: string) =>
  client.post(`/fines/${loanId}/pay`).then((r) => r.data);
