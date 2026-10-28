import { IsOptional, IsUUID } from "class-validator";

export class CreateLoanDto {
  @IsUUID("4")
  bookId!: string;

  @IsOptional()
  @IsUUID("4")
  memberId?: string;
}
