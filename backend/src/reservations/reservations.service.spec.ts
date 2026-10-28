import { ConflictException } from "@nestjs/common";
import { ReservationStatus } from "@prisma/client";
import { ReservationsService } from "./reservations.service";

describe("ReservationsService", () => {
  let service: ReservationsService;
  const mockPrisma: any = {
    user: { findUnique: jest.fn() },
    book: { findUnique: jest.fn(), update: jest.fn() },
    loan: { findFirst: jest.fn() },
    reservation: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const member = { id: "member-id", role: "MEMBER" as const };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReservationsService(mockPrisma);
    mockPrisma.user.findUnique.mockResolvedValue({ id: member.id });
    mockPrisma.book.findUnique.mockResolvedValue({
      id: "book-id",
      availableCopies: 0,
    });
    mockPrisma.loan.findFirst.mockResolvedValue(null);
    mockPrisma.reservation.findFirst.mockResolvedValue(null);
    mockPrisma.reservation.count.mockResolvedValue(0);
  });

  it("should be defined", () => expect(service).toBeDefined());

  it("creates a pending reservation", async () => {
    mockPrisma.reservation.create.mockResolvedValue({
      status: ReservationStatus.PENDING,
    });
    await expect(
      service.create({ bookId: "book-id" }, member),
    ).resolves.toEqual({ status: ReservationStatus.PENDING });
  });

  it("rejects an available book", async () => {
    mockPrisma.book.findUnique.mockResolvedValue({
      id: "book-id",
      availableCopies: 1,
    });
    await expect(
      service.create({ bookId: "book-id" }, member),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects duplicate reservations", async () => {
    mockPrisma.reservation.findFirst.mockResolvedValue({ id: "existing" });
    await expect(
      service.create({ bookId: "book-id" }, member),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects more than three active reservations", async () => {
    mockPrisma.reservation.count.mockResolvedValue(3);
    await expect(
      service.create({ bookId: "book-id" }, member),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("cancels a pending reservation", async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: "r",
      userId: member.id,
      status: ReservationStatus.PENDING,
      bookId: "book-id",
    });
    mockPrisma.reservation.update.mockResolvedValue({
      status: ReservationStatus.CANCELLED,
    });
    mockPrisma.$transaction.mockImplementation((callback: any) =>
      callback(mockPrisma),
    );
    await expect(service.cancel(member, "r")).resolves.toEqual({
      status: ReservationStatus.CANCELLED,
    });
  });

  it("cancels a hold, releases a copy, and promotes the next reservation", async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: "r",
      userId: member.id,
      status: ReservationStatus.HOLD,
      bookId: "book-id",
    });
    mockPrisma.reservation.update.mockResolvedValue({
      status: ReservationStatus.CANCELLED,
    });
    mockPrisma.reservation.findFirst
      .mockResolvedValueOnce({ id: "next" })
      .mockResolvedValueOnce(null);
    mockPrisma.$transaction.mockImplementation((callback: any) =>
      callback(mockPrisma),
    );
    await expect(service.cancel(member, "r")).resolves.toEqual({
      status: ReservationStatus.CANCELLED,
    });
    expect(mockPrisma.book.update).toHaveBeenCalled();
  });

  it("rejects an already cancelled reservation", async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      userId: member.id,
      status: ReservationStatus.CANCELLED,
    });
    await expect(service.cancel(member, "r")).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
