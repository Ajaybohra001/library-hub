import { Type } from "class-transformer";
import { IsIn, IsOptional, IsUUID } from "class-validator";

export class QueryLoansDto {
  @IsOptional()
  @IsIn(["active", "returned", "all"])
  status: "active" | "returned" | "all" = "active";

  @IsOptional()
  @IsUUID("4")
  memberId?: string;
}
