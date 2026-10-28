import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../prisma/prisma.module";
import { LoansController } from "./loans.controller";
import { LoansService } from "./loans.service";

@Module({
  imports: [JwtModule, PrismaModule],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
