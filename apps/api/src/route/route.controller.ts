import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RouteService } from './route.service';
import { CreateRouteDto } from './dto/create-route.dto';

@Controller('plans/:planId/route')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post()
  create(@Param('planId') planId: string, @Body() dto: CreateRouteDto) {
    return this.routeService.create(planId, dto);
  }

  @Get()
  get(@Param('planId') planId: string) {
    return this.routeService.findByPlan(planId);
  }
}
