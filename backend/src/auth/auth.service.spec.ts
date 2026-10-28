import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService({} as never);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
