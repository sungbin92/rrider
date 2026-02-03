import { Controller, Get, Param, Post } from '@nestjs/common';
import { SegmentService } from './segment.service';

@Controller('plans/:planId/segments')
export class SegmentController {
  constructor(private readonly segmentService: SegmentService) {}

  @Post('search')
  search(@Param('planId') planId: string) {
    return this.segmentService.searchAndSave(planId);
  }

  @Get()
  findAll(@Param('planId') planId: string) {
    return this.segmentService.findByPlan(planId);
  }

  @Post(':segmentId/enrich')
  enrich(@Param('segmentId') segmentId: string) {
    return this.segmentService.enrich(segmentId);
  }
}
