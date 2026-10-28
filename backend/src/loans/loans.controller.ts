import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CreateLoanDto, QueryLoansDto } from "./dto";
import { AuthenticatedUser, LoansService } from "./loans.service";

@Controller("loans")
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  create(
    @Body() dto: CreateLoanDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.loansService.createLoan(dto, request.user);
  }

  @Get()
  list(
    @Query() query: QueryLoansDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.loansService.listLoans(query, request.user);
  }

  @Post(":id/return")
  return(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.loansService.returnLoan(id, request.user);
  }

  @Post(":id/renew")
  renew(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.loansService.renewLoan(id, request.user);
  }
}
