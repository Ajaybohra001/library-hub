import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { QueryFinesDto } from "./dto";

export type FinesActor = { id: string; role: "MEMBER" | "STAFF" };

@Injectable()
export class FinesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    role: FinesActor["role"],
    query: QueryFinesDto,
  ) {
    const memberId = query.memberId ?? (role === "MEMBER" ? userId : undefined);
    if (role === "MEMBER" && query.memberId && query.memberId !== userId) {
      throw new ForbiddenException();
    }
    if (query.memberId) {
      const member = await this.prisma.user.findUnique({
        where: { id: query.memberId },
        select: { id: true },
      });
      if (!member) throw new NotFoundException("Member not found");
    }

    const items = await this.prisma.loan.findMany({
      where: {
        finePaise: { gt: 0 },
        ...(memberId ? { userId: memberId } : {}),
      },
      orderBy: [{ paidAt: "asc" }, { returnedAt: "desc" }, { id: "asc" }],
      select: {
        id: true,
        userId: true,
        finePaise: true,
        paidAt: true,
        returnedAt: true,
      },
    });
    return { items };
  }

  async pay(userId: string, role: FinesActor["role"], loanId: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException("Loan not found");
    if (role !== "STAFF" && loan.userId !== userId) {
      throw new ForbiddenException();
    }
    if (loan.finePaise === 0) {
      throw new BadRequestException("Loan has no fine");
    }
    if (loan.paidAt !== null) {
      throw new ConflictException("Fine already paid");
    }

    const paidAt = new Date();
    const updated = await this.prisma.loan.updateMany({
      where: { id: loanId, finePaise: { gt: 0 }, paidAt: null },
      data: { paidAt },
    });
    if (updated.count !== 1) throw new ConflictException("Fine already paid");
    return { loanId, memberId: loan.userId, finePaise: loan.finePaise, paidAt };
  }
}
