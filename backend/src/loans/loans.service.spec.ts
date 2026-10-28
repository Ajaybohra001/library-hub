import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { LoansService } from "./loans.service";

describe("LoansService", () => {
  let service: LoansService;
  const mockPrisma = {
    user: { findUnique: jest.fn() },
    book: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    reservation: { findFirst: jest.fn(), update: jest.fn() },
    loan: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;
  const member = { id: "member-id", role: "MEMBER" as const };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LoansService(mockPrisma);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createLoan", () => {
    it("creates a loan for an available book", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(member);
      mockPrisma.book.findUnique.mockResolvedValue({
        id: "book-id",
        availableCopies: 1,
      });
      mockPrisma.loan.count.mockResolvedValue(0);
      mockPrisma.loan.findFirst.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (callback: any) =>
        callback({
          book: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          loan: { create: jest.fn().mockResolvedValue({ id: "loan-id" }) },
        }),
      );
      await expect(
        service.createLoan({ bookId: "book-id" }, member),
      ).resolves.toEqual({ id: "loan-id" });
    });

    it("rejects a fourth active loan", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(member);
      mockPrisma.book.findUnique.mockResolvedValue({ availableCopies: 1 });
      mockPrisma.loan.count.mockResolvedValue(3);
      mockPrisma.loan.findFirst.mockResolvedValue(null);
      await expect(
        service.createLoan({ bookId: "book-id" }, member),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("listLoans", () => {
    it("returns loans", async () => {
      mockPrisma.loan.findMany.mockResolvedValue([]);
      await expect(
        service.listLoans({ status: "active" }, member),
      ).resolves.toEqual({ items: [] });
    });

    it("rejects another member's list", async () => {
      await expect(
        service.listLoans({ status: "active", memberId: "other" }, member),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("returnLoan", () => {
    it("returns an active loan", async () => {
      mockPrisma.loan.findUnique.mockResolvedValue({
        id: "loan-id",
        userId: member.id,
        bookId: "book-id",
        dueAt: new Date(),
      });
      mockPrisma.$transaction.mockImplementation(async (callback: any) =>
        callback({
          book: { update: jest.fn() },
          reservation: {
            findFirst: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
          },
          loan: { update: jest.fn().mockResolvedValue({ id: "loan-id" }) },
        }),
      );
      await expect(service.returnLoan("loan-id", member)).resolves.toEqual({
        id: "loan-id",
      });
    });

    it("rejects an unknown loan", async () => {
      mockPrisma.loan.findUnique.mockResolvedValue(null);
      await expect(
        service.returnLoan("missing", member),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("renewLoan", () => {
    it("renews an active loan", async () => {
      mockPrisma.loan.findUnique.mockResolvedValue({
        id: "loan-id",
        userId: member.id,
        dueAt: new Date(),
        renewalCount: 0,
        returnedAt: null,
      });
      mockPrisma.loan.update.mockResolvedValue({ id: "loan-id" });
      await expect(service.renewLoan("loan-id", member)).resolves.toEqual({
        id: "loan-id",
      });
    });

    it("rejects an unknown loan", async () => {
      mockPrisma.loan.findUnique.mockResolvedValue(null);
      await expect(service.renewLoan("missing", member)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
