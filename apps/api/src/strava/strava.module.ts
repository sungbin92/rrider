import { Module } from '@nestjs/common';
import { StravaController } from './strava.controller';
import { StravaClient } from './strava.client';
import { StravaService } from './strava.service';
import { StravaTokenService } from './strava-token.service';

@Module({
  controllers: [StravaController],
  providers: [StravaClient, StravaService, StravaTokenService],
  exports: [StravaService],
})
export class StravaModule {}
