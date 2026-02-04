import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ORSClient } from './ors.client';
import { ORSService } from './ors.service';

@Module({
  imports: [ConfigModule],
  providers: [ORSClient, ORSService],
  exports: [ORSService],
})
export class RoutingModule {}
