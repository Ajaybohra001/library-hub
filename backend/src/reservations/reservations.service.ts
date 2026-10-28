import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, ReservationStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReservationDto, QueryReservationsDto } from "./dto";

export type ReservationActor = { id: string; role: "MEMBER" | "STAFF" };

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReservationDto, actor: ReservationActor) {
    const memberId = actor.role === "STAFF" ? dto.memberId : actor.id;
    if (actor.role !== "STAFF" && dto.memberId && dto.memberId !== actor.id)
      throw new ForbiddenException();
    if (!memberId) throw new ConflictException("Staff must provide memberId");

    const [member, book, loan, unpaidFine, duplicate, activeCount] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: memberId },
          select: { id: true },
        }),
        this.prisma.book.findUnique({
          where: { id: dto.bookId },
          select: { id: true, availableCopies: true },
        }),
        this.prisma.loan.findFirst({
          where: { userId: memberId, bookId: dto.bookId, returnedAt: null },
        }),
        this.prisma.loan.findFirst({
          where: { userId: memberId, finePaise: { gt: 0 }, paidAt: null },
          select: { id: true },
        }),
        this.prisma.reservation.findFirst({
          where: {
            userId: memberId,
            bookId: dto.bookId,
            status: { in: [ReservationStatus.PENDING, ReservationStatus.HOLD] },
          },
        }),
        this.prisma.reservation.count({
          where: {
            userId: memberId,
            status: { in: [ReservationStatus.PENDING, ReservationStatus.HOLD] },
          },
        }),
      ]);
    if (!member) throw new NotFoundException("Member not found");
    if (!book) throw new NotFoundException("Book not found");
    if (book.availableCopies > 0)
      throw new ConflictException("Book is available");
    if (loan) throw new ConflictException("Member already has this book");
    if (unpaidFine) throw new ConflictException("Member has unpaid fines");
    if (duplicate)
      throw new ConflictException("Active reservation already exists");
    if (activeCount >= 3)
      throw new ConflictException("Maximum active reservations reached");
    return this.prisma.reservation.create({
      data: { userId: memberId, bookId: dto.bookId },
      select: this.select(),
    });
  }

  async findAll(actor: ReservationActor, query: QueryReservationsDto) {
    const memberId =
      query.memberId ?? (actor.role === "MEMBER" ? actor.id : undefined);
    if (actor.role !== "STAFF" && query.memberId && query.memberId !== actor.id)
      throw new ForbiddenException();
    if (
      query.memberId &&
      !(await this.prisma.user.findUnique({
        where: { id: query.memberId },
        select: { id: true },
      }))
    )
      throw new NotFoundException("Member not found");
    return {
      items: await this.prisma.reservation.findMany({
        where: {
          ...(memberId ? { userId: memberId } : {}),
          ...(query.status ? { status: query.status } : {}),
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: this.select(),
      }),
    };
  }

  async cancel(actor: ReservationActor, id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });
    if (!reservation) throw new NotFoundException("Reservation not found");
    if (actor.role !== "STAFF" && reservation.userId !== actor.id)
      throw new ForbiddenException();
    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.HOLD
    )
      throw new ConflictException("Reservation cannot be cancelled");
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.CANCELLED },
        select: this.select(),
      });
      if (reservation.status === ReservationStatus.HOLD) {
        await tx.book.update({
          where: { id: reservation.bookId },
          data: { availableCopies: { increment: 1 } },
        });
        await this.promote(tx, reservation.bookId, now);
      }
      return updated;
    });
  }

  async expireHolds() {
    const holds = await this.prisma.reservation.findMany({
      where: {
        status: ReservationStatus.HOLD,
        holdExpiresAt: { lt: new Date() },
      },
      select: { id: true, bookId: true },
    });
    for (const hold of holds)
      await this.prisma.$transaction(async (tx) => {
        const changed = await tx.reservation.updateMany({
          where: { id: hold.id, status: ReservationStatus.HOLD },
          data: { status: ReservationStatus.EXPIRED, holdExpiresAt: null },
        });
        if (changed.count) {
          await tx.book.update({
            where: { id: hold.bookId },
            data: { availableCopies: { increment: 1 } },
          });
          await this.promote(tx, hold.bookId, new Date());
        }
      });
  }

  private async promote(tx: any, bookId: string, now: Date) {
    const next = await tx.reservation.findFirst({
      where: { bookId, status: ReservationStatus.PENDING },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    if (next)
      await tx.reservation.update({
        where: { id: next.id },
        data: {
          status: ReservationStatus.HOLD,
          holdExpiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        },
      });
  }
  private select(): Prisma.ReservationSelect {
    return {
      id: true,
      userId: true,
      bookId: true,
      status: true,
      createdAt: true,
      holdExpiresAt: true,
    };
  }
}
