import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  create(@Body() createPlanDto: CreatePlanDto) {
    return this.planService.create({
      ...createPlanDto,
      rideDate: new Date(createPlanDto.rideDate),
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.planService.findOne(id);
  }
}
