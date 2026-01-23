import { Controller, Get, Param, Post } from '@nestjs/common';
import { PlaceService } from './place.service';

@Controller('plans/:planId/places')
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {}

  @Post('search')
  search(@Param('planId') planId: string) {
    return this.placeService.searchAndSave(planId);
  }

  @Get()
  find(@Param('planId') planId: string) {
    return this.placeService.findByPlan(planId);
  }
}
