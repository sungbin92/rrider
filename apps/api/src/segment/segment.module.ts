import { Module } from '@nestjs/common';
import { SegmentController } from './segment.controller';
import { SegmentService } from './segment.service';
import { StravaModule } from '../strava/strava.module';

@Module({
  imports: [StravaModule],
  controllers: [SegmentController],
  providers: [SegmentService],
})
export class SegmentModule {}
