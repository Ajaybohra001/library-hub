import {
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
import { QueryFinesDto } from "./dto";
import { FinesActor, FinesService } from "./fines.service";

@Controller("fines")
@UseGuards(JwtAuthGuard)
export class FinesController {
  constructor(private readonly finesService: FinesService) {}

  @Get()
  findAll(@Req() request: { user: FinesActor }, @Query() query: QueryFinesDto) {
    return this.finesService.findAll(request.user.id, request.user.role, query);
  }

  @Post(":loanId/pay")
  pay(
    @Param("loanId", new ParseUUIDPipe({ version: "4" })) loanId: string,
    @Req() request: { user: FinesActor },
  ) {
    return this.finesService.pay(request.user.id, request.user.role, loanId);
  }
}
