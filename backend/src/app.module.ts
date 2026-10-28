import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { BooksModule } from "./books/books.module";
import { FinesModule } from "./fines/fines.module";
import { LoansModule } from "./loans/loans.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ReservationsModule } from "./reservations/reservations.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    HealthModule,
    BooksModule,
    FinesModule,
    LoansModule,
    ReservationsModule,
  ],
})
export class AppModule {}
