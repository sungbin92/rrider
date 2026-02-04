import {
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Patch,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { PlanService } from './plan.service';
import { GpxService } from './gpx.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';

@Controller('plans')
export class PlanController {
  constructor(
    private readonly planService: PlanService,
    private readonly gpxService: GpxService,
  ) {}

  @Post()
  create(
    @Body() createPlanDto: CreatePlanDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.planService.create({
      ...createPlanDto,
      rideDate: new Date(createPlanDto.rideDate),
      userId: user.id,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.planService.findOne(id, undefined, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.planService.update(id, user.id, updatePlanDto);
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.planService.findAll(user.id);
  }
  @Get(':id/gpx')
  @Header('Content-Type', 'application/gpx+xml')
  @Header('Content-Disposition', 'attachment; filename="riding_plan.gpx"')
  async getGpx(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<StreamableFile> {
    const gpx = await this.gpxService.generateGpx(id, user.id);
    const buffer = Buffer.from(gpx, 'utf-8');
    return new StreamableFile(buffer);
  }

  @Get(':id/overview')
  async overview(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const plan = await this.planService.findOne(
      id,
      {
        route: true,
        places: true,
        recommendation: true,
      },
      user.id,
    );

    if (!plan) throw new NotFoundException();

    let recommendedPlaces: (typeof plan.places)[number][] = [];

    if (plan.recommendation) {
      const placeMap = new Map<string, (typeof plan.places)[number]>(
        plan.places.map((p) => [p.id, p]),
      );

      recommendedPlaces = plan.recommendation.placeIds
        .map((id) => placeMap.get(id))
        .filter((p): p is (typeof plan.places)[number] => Boolean(p));
    }

    return {
      plan: {
        id: plan.id,
        title: plan.title,
        rideDate: plan.rideDate,
        startLat: plan.startLat,
        startLng: plan.startLng,
        endLat: plan.endLat,
        endLng: plan.endLng,
        waypoints:
          (plan.waypoints as Array<{ lat: number; lng: number }>) ?? [],
      },
      route: plan.route,
      places: plan.places,
      recommendation: plan.recommendation
        ? {
            summary: plan.recommendation.summary,
            estimatedTotalTimeMin: plan.recommendation.estimatedTotalTimeMin,
            suggestedStops: plan.recommendation.suggestedStops,
            places: recommendedPlaces,
          }
        : null,
    };
  }
}
