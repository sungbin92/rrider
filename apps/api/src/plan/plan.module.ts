import { Module } from '@nestjs/common';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';
import { GpxService } from './gpx.service';

@Module({
  controllers: [PlanController],
  providers: [PlanService, GpxService],
})
export class PlanModule {}
