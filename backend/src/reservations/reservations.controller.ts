import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CreateReservationDto, QueryReservationsDto } from "./dto";
import { ReservationActor, ReservationsService } from "./reservations.service";

@Controller("reservations")
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(
    @Body() dto: CreateReservationDto,
    @Req() req: { user: ReservationActor },
  ) {
    return this.reservationsService.create(dto, req.user);
  }

  @Get()
  findAll(
    @Query() query: QueryReservationsDto,
    @Req() req: { user: ReservationActor },
  ) {
    return this.reservationsService.findAll(req.user, query);
  }

  @Post(":id/cancel")
  cancel(@Param("id") id: string, @Req() req: { user: ReservationActor }) {
    return this.reservationsService.cancel(req.user, id);
  }
}
