import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { RouteService } from './route.service';
import { CreateRouteDto } from './dto/create-route.dto';

// Valid cycling profiles for ORS
const VALID_PROFILES = [
  'cycling-regular',
  'cycling-road',
  'cycling-mountain',
  'cycling-electric',
] as const;

type CyclingProfile = (typeof VALID_PROFILES)[number];

@Controller('plans/:planId/route')
export class RouteController {
  private readonly logger = new Logger(RouteController.name);

  constructor(private readonly routeService: RouteService) {}

  @Post()
  create(@Param('planId') planId: string, @Body() dto: CreateRouteDto) {
    return this.routeService.create(planId, dto);
  }

  @Put()
  update(@Param('planId') planId: string, @Body() dto: CreateRouteDto) {
    return this.routeService.update(planId, dto);
  }

  @Get()
  get(@Param('planId') planId: string) {
    return this.routeService.findByPlan(planId);
  }

  @Post('calculate')
  calculate(
    @Param('planId') planId: string,
    @Query('profile') profile?: string,
  ) {
    // Validate profile if provided
    const cyclingProfile: CyclingProfile =
      profile && VALID_PROFILES.includes(profile as CyclingProfile)
        ? (profile as CyclingProfile)
        : 'cycling-regular';

    this.logger.log(
      `Calculate route for plan ${planId} with profile ${cyclingProfile}`,
    );

    // Use ORS by default (better cycling routes)
    return this.routeService.calculateFromORS(planId, cyclingProfile);
  }

  // Keep GraphHopper as fallback
  @Post('calculate/graphhopper')
  calculateGraphHopper(@Param('planId') planId: string) {
    this.logger.log(`Calculate GraphHopper route for plan ${planId}`);
    return this.routeService.calculateFromGraphHopper(planId);
  }
}
