import { IsNumber, IsString } from 'class-validator';

export class CreateRouteDto {
  @IsNumber()
  distance: number;

  @IsNumber()
  duration: number;

  @IsString()
  polyline: string;
}
