import { ReservationsService } from "./reservations.service";

describe("ReservationsService", () => {
  let service: ReservationsService;

  beforeEach(() => {
    service = new ReservationsService({} as never);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
