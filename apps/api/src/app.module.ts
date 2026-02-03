import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PlanModule } from './plan/plan.module';
import { RouteModule } from './route/route.module';
import { PlaceModule } from './place/place.module';
import { ConfigModule } from '@nestjs/config';
import { RecommendationModule } from './recommendation/recommendation.module';
import { SegmentModule } from './segment/segment.module';

@Module({
  imports: [
    PrismaModule,
    PlanModule,
    RouteModule,
    PlaceModule,
    ConfigModule.forRoot({ isGlobal: true }),
    RecommendationModule,
    SegmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
