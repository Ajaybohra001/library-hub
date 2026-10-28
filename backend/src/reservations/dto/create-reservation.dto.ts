import { IsOptional, IsUUID } from "class-validator";

export class CreateReservationDto {
  @IsUUID()
  bookId!: string;

  @IsOptional()
  @IsUUID()
  memberId?: string;
}
