import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class SearchSegmentsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minClimbCategory?: number;
}
