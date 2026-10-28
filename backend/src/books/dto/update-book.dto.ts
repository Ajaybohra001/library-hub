import { Transform } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  author?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  isbn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalCopies?: number;
}
