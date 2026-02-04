import { Module } from '@nestjs/common';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';
import { GraphHopperModule } from '../graphhopper/graphhopper.module';
import { RoutingModule } from '../routing/routing.module';

@Module({
  imports: [GraphHopperModule, RoutingModule],
  controllers: [RouteController],
  providers: [RouteService],
  exports: [RouteService],
})
export class RouteModule {}
