import { IsOptional, IsUUID } from "class-validator";

export class QueryFinesDto {
  @IsOptional()
  @IsUUID()
  memberId?: string;
}
