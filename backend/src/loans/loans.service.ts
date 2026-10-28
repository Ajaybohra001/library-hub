import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLoanDto, QueryLoansDto } from "./dto";

export interface AuthenticatedUser {
  id: string;
  role: "MEMBER" | "STAFF";
}

@Injectable()
export class LoansService {
  constructor(private readonly prisma: PrismaService) {}

  async createLoan(dto: CreateLoanDto, actor: AuthenticatedUser) {
    const memberId = actor.role === "STAFF" ? dto.memberId : actor.id;
    if (actor.role !== "STAFF" && dto.memberId && dto.memberId !== actor.id) {
      throw new ForbiddenException("Members can borrow only for themselves");
    }
    if (!memberId) throw new ConflictException("Staff must provide memberId");

    const [member, book, activeCount, duplicate] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: memberId } }),
      this.prisma.book.findUnique({ where: { id: dto.bookId } }),
      this.prisma.loan.count({ where: { userId: memberId, returnedAt: null } }),
      this.prisma.loan.findFirst({
        where: { userId: memberId, bookId: dto.bookId, returnedAt: null },
      }),
    ]);
    if (!member) throw new NotFoundException("Member not found");
    if (!book) throw new NotFoundException("Book not found");
    if (activeCount >= 3)
      throw new ConflictException("Maximum active loans reached");
    if (duplicate) throw new ConflictException("Member already has this book");
    if (book.availableCopies < 1)
      throw new ConflictException("Book is unavailable");

    const now = new Date();
    const dueAt = new Date(now);
    dueAt.setUTCDate(dueAt.getUTCDate() + 14);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.book.updateMany({
        where: { id: dto.bookId, availableCopies: { gt: 0 } },
        data: { availableCopies: { decrement: 1 } },
      });
      if (updated.count !== 1)
        throw new ConflictException("Book is unavailable");
      return tx.loan.create({
        data: { userId: memberId, bookId: dto.bookId, borrowedAt: now, dueAt },
        select: {
          id: true,
          bookId: true,
          userId: true,
          borrowedAt: true,
          dueAt: true,
          returnedAt: true,
          renewalCount: true,
          finePaise: true,
        },
      });
    });
  }

  async listLoans(query: QueryLoansDto, actor: AuthenticatedUser) {
    const memberId = query.memberId ?? actor.id;
    if (actor.role !== "STAFF" && memberId !== actor.id)
      throw new ForbiddenException();
    if (query.memberId) {
      const member = await this.prisma.user.findUnique({
        where: { id: query.memberId },
        select: { id: true },
      });
      if (!member) throw new NotFoundException("Member not found");
    }
    const returnedAt =
      query.status === "active"
        ? null
        : query.status === "returned"
          ? { not: null }
          : undefined;
    const items = await this.prisma.loan.findMany({
      where: {
        userId: memberId,
        ...(returnedAt === undefined ? {} : { returnedAt }),
      },
      orderBy: [{ borrowedAt: "desc" }, { id: "asc" }],
      select: {
        id: true,
        bookId: true,
        userId: true,
        borrowedAt: true,
        dueAt: true,
        returnedAt: true,
        renewalCount: true,
        finePaise: true,
      },
    });
    return { items };
  }

  async returnLoan(id: string, actor: AuthenticatedUser) {
    const loan = await this.prisma.loan.findUnique({ where: { id } });
    if (!loan) throw new NotFoundException("Loan not found");
    if (actor.role !== "STAFF" && loan.userId !== actor.id)
      throw new ForbiddenException();
    if (loan.returnedAt) throw new ConflictException("Loan already returned");
    const returnedAt = new Date();
    const finePaise =
      Math.max(
        0,
        Math.ceil(
          (Date.UTC(
            returnedAt.getUTCFullYear(),
            returnedAt.getUTCMonth(),
            returnedAt.getUTCDate(),
          ) -
            Date.UTC(
              loan.dueAt.getUTCFullYear(),
              loan.dueAt.getUTCMonth(),
              loan.dueAt.getUTCDate(),
            )) /
            86400000,
        ),
      ) * 100;
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findFirst({
        where: { bookId: loan.bookId, status: "PENDING" },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });
      if (reservation) {
        await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: "HOLD",
            holdExpiresAt: new Date(returnedAt.getTime() + 48 * 60 * 60 * 1000),
          },
        });
      } else {
        await tx.book.update({
          where: { id: loan.bookId },
          data: { availableCopies: { increment: 1 } },
        });
      }
      return tx.loan.update({
        where: { id },
        data: { returnedAt, finePaise },
        select: {
          id: true,
          bookId: true,
          userId: true,
          borrowedAt: true,
          dueAt: true,
          returnedAt: true,
          renewalCount: true,
          finePaise: true,
        },
      });
    });
  }

  async renewLoan(id: string, actor: AuthenticatedUser) {
    const loan = await this.prisma.loan.findUnique({ where: { id } });
    if (!loan) throw new NotFoundException("Loan not found");
    if (actor.role !== "STAFF" && loan.userId !== actor.id)
      throw new ForbiddenException();
    if (loan.returnedAt || loan.renewalCount >= 1)
      throw new ConflictException("Loan cannot be renewed");
    const dueAt = new Date(loan.dueAt);
    dueAt.setUTCDate(dueAt.getUTCDate() + 7);
    return this.prisma.loan.update({
      where: { id },
      data: { dueAt, renewalCount: 1 },
      select: {
        id: true,
        bookId: true,
        userId: true,
        borrowedAt: true,
        dueAt: true,
        returnedAt: true,
        renewalCount: true,
        finePaise: true,
      },
    });
  }
}
