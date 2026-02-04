import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

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

  @IsOptional()
  waypoints?: { lat: number; lng: number }[];

  @IsOptional()
  route?: {
    distance: number;
    duration: number;
    polyline: string;
  };
}
