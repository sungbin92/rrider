import { IsDateString, IsNumber, IsString } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  title: string;

  @IsDateString()
  rideDate: string;

  @IsNumber()
  startLat: number;

  @IsNumber()
  startLng: number;

  @IsNumber()
  endLat: number;

  @IsNumber()
  endLng: number;
}
