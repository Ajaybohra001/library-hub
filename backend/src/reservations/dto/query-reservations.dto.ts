import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { ReservationStatus } from "@prisma/client";

export class QueryReservationsDto {
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsUUID()
  memberId?: string;
}
