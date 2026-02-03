import { Module, forwardRef } from '@nestjs/common';
import { StravaController } from './strava.controller';
import { StravaClient } from './strava.client';
import { StravaService } from './strava.service';
import { StravaTokenService } from './strava-token.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [StravaController],
  providers: [StravaClient, StravaService, StravaTokenService],
  exports: [StravaService],
})
export class StravaModule {}
