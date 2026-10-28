import { client } from "./client";
export const register = (dto: {
  name: string;
  email: string;
  password: string;
}) => client.post("/auth/register", dto).then((r) => r.data);
export const login = (dto: { email: string; password: string }) =>
  client.post("/auth/login", dto).then((r) => r.data);
