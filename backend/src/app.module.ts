import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { BooksModule } from "./books/books.module";
import { LoansModule } from "./loans/loans.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    HealthModule,
    BooksModule,
    LoansModule,
  ],
})
export class AppModule {}
