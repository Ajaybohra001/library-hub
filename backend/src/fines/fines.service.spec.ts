import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { FinesService } from "./fines.service";

describe("FinesService", () => {
  let service: FinesService;
  const mockPrisma = {
    user: { findUnique: jest.fn() },
    loan: { findMany: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FinesService(mockPrisma as never);
  });

  it("findAll returns only loans with finePaise > 0", async () => {
    mockPrisma.loan.findMany.mockResolvedValue([
      { id: "loan-1", userId: "member-1", finePaise: 100, paidAt: null },
    ]);
    await expect(service.findAll("member-1", "MEMBER", {})).resolves.toEqual({
      items: [
        { id: "loan-1", userId: "member-1", finePaise: 100, paidAt: null },
      ],
    });
    expect(mockPrisma.loan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { finePaise: { gt: 0 }, userId: "member-1" },
      }),
    );
  });

  it("findAll MEMBER cannot see other member fines", async () => {
    await expect(
      service.findAll("member-1", "MEMBER", { memberId: "member-2" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("pay happy path sets paidAt", async () => {
    mockPrisma.loan.findUnique.mockResolvedValue({
      id: "loan-1",
      userId: "member-1",
      finePaise: 100,
      paidAt: null,
    });
    mockPrisma.loan.updateMany.mockResolvedValue({ count: 1 });
    await expect(service.pay("member-1", "MEMBER", "loan-1")).resolves.toEqual(
      expect.objectContaining({
        loanId: "loan-1",
        memberId: "member-1",
        finePaise: 100,
        paidAt: expect.any(Date),
      }),
    );
  });

  it("pay finePaise=0 throws BadRequestException", async () => {
    mockPrisma.loan.findUnique.mockResolvedValue({
      userId: "member-1",
      finePaise: 0,
      paidAt: null,
    });
    await expect(
      service.pay("member-1", "MEMBER", "loan-1"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("pay already paid throws ConflictException", async () => {
    mockPrisma.loan.findUnique.mockResolvedValue({
      userId: "member-1",
      finePaise: 100,
      paidAt: new Date(),
    });
    await expect(
      service.pay("member-1", "MEMBER", "loan-1"),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("pay wrong member throws ForbiddenException", async () => {
    mockPrisma.loan.findUnique.mockResolvedValue({
      userId: "member-2",
      finePaise: 100,
      paidAt: null,
    });
    await expect(
      service.pay("member-1", "MEMBER", "loan-1"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
