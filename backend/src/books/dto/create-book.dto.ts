import { Transform } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateBookDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  title!: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  author!: string;

  @IsString()
  @IsNotEmpty()
  isbn!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsInt()
  @Min(1)
  totalCopies!: number;
}
