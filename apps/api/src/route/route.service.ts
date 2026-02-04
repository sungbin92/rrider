import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { GraphHopperService } from '../graphhopper/graphhopper.service';
import { CalculatedRoute } from '../graphhopper/graphhopper.types';
import {
  ORSService,
  CalculatedRoute as ORSCalculatedRoute,
} from '../routing/ors.service';
import type { CyclingProfile } from '../routing/ors.client';

@Injectable()
export class RouteService {
  private readonly logger = new Logger(RouteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly graphHopperService: GraphHopperService,
    private readonly orsService: ORSService,
  ) {}

  async create(planId: string, dto: CreateRouteDto) {
    const plan = await this.prisma.client.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    return this.prisma.client.route.create({
      data: {
        planId,
        distance: dto.distance,
        duration: dto.duration,
        polyline: dto.polyline,
      },
    });
  }

  findByPlan(planId: string) {
    return this.prisma.client.route.findUnique({
      where: { planId },
    });
  }

  async update(planId: string, dto: CreateRouteDto) {
    const plan = await this.prisma.client.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    return this.prisma.client.route.upsert({
      where: { planId },
      update: {
        distance: dto.distance,
        duration: dto.duration,
        polyline: dto.polyline,
      },
      create: {
        planId,
        distance: dto.distance,
        duration: dto.duration,
        polyline: dto.polyline,
      },
    });
  }

  async calculateFromGraphHopper(
    planId: string,
  ): Promise<CalculatedRoute> {
    this.logger.log(`Calculating route for plan ${planId}`);

    const plan = await this.prisma.client.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    this.logger.log(`Plan found: ${plan.title}, start: (${plan.startLat}, ${plan.startLng}), end: (${plan.endLat}, ${plan.endLng})`);

    // Parse waypoints from plan - can be [[lat, lng], ...] or [{lat, lng}, ...]
    const rawWaypoints = plan.waypoints as
      | Array<{ lat: number; lng: number }>
      | Array<[number, number]>
      | null;

    const waypoints: Array<{ lat: number; lng: number }> = [];
    if (rawWaypoints && Array.isArray(rawWaypoints)) {
      for (const wp of rawWaypoints) {
        if (Array.isArray(wp)) {
          // Format: [lat, lng]
          waypoints.push({ lat: wp[0], lng: wp[1] });
        } else if (wp && typeof wp === 'object' && 'lat' in wp && 'lng' in wp) {
          // Format: {lat, lng}
          waypoints.push(wp);
        }
      }
    }

    this.logger.log(`Waypoints: ${JSON.stringify(waypoints)}`);

    try {
      // Calculate route via GraphHopper
      const calculatedRoute = await this.graphHopperService.calculateRoute(
        { lat: plan.startLat, lng: plan.startLng },
        { lat: plan.endLat, lng: plan.endLng },
        waypoints,
      );

      this.logger.log(`Route calculated: distance=${calculatedRoute.distance}, duration=${calculatedRoute.duration}`);

      // Save route to database
      await this.prisma.client.route.upsert({
        where: { planId },
        update: {
          distance: calculatedRoute.distance,
          duration: calculatedRoute.duration,
          polyline: calculatedRoute.polyline,
          instructions: calculatedRoute.instructions as any,
          snappedWaypoints: calculatedRoute.snappedWaypoints as any,
        },
        create: {
          planId,
          distance: calculatedRoute.distance,
          duration: calculatedRoute.duration,
          polyline: calculatedRoute.polyline,
          instructions: calculatedRoute.instructions as any,
          snappedWaypoints: calculatedRoute.snappedWaypoints as any,
        },
      });

      return calculatedRoute;
    } catch (error) {
      this.logger.error(`Failed to calculate route: ${error}`);
      throw error;
    }
  }

  async calculateFromORS(
    planId: string,
    profile: CyclingProfile = 'cycling-regular',
  ): Promise<ORSCalculatedRoute> {
    this.logger.log(`Calculating ORS route for plan ${planId} with profile ${profile}`);

    const plan = await this.prisma.client.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    this.logger.log(
      `Plan found: ${plan.title}, start: (${plan.startLat}, ${plan.startLng}), end: (${plan.endLat}, ${plan.endLng})`,
    );

    // Parse waypoints from plan - can be [[lat, lng], ...] or [{lat, lng}, ...]
    const rawWaypoints = plan.waypoints as
      | Array<{ lat: number; lng: number }>
      | Array<[number, number]>
      | null;

    const waypoints: Array<{ lat: number; lng: number }> = [];
    if (rawWaypoints && Array.isArray(rawWaypoints)) {
      for (const wp of rawWaypoints) {
        if (Array.isArray(wp)) {
          // Format: [lat, lng]
          waypoints.push({ lat: wp[0], lng: wp[1] });
        } else if (wp && typeof wp === 'object' && 'lat' in wp && 'lng' in wp) {
          // Format: {lat, lng}
          waypoints.push(wp);
        }
      }
    }

    this.logger.log(`Waypoints: ${JSON.stringify(waypoints)}`);

    try {
      // Calculate route via ORS
      const calculatedRoute = await this.orsService.calculateRoute(
        { lat: plan.startLat, lng: plan.startLng },
        { lat: plan.endLat, lng: plan.endLng },
        waypoints,
        profile,
      );

      this.logger.log(
        `ORS Route calculated: distance=${calculatedRoute.distance}, duration=${calculatedRoute.duration}`,
      );

      // Save route to database
      await this.prisma.client.route.upsert({
        where: { planId },
        update: {
          distance: calculatedRoute.distance,
          duration: calculatedRoute.duration,
          polyline: calculatedRoute.polyline,
          instructions: calculatedRoute.instructions as any,
          snappedWaypoints: calculatedRoute.snappedWaypoints as any,
        },
        create: {
          planId,
          distance: calculatedRoute.distance,
          duration: calculatedRoute.duration,
          polyline: calculatedRoute.polyline,
          instructions: calculatedRoute.instructions as any,
          snappedWaypoints: calculatedRoute.snappedWaypoints as any,
        },
      });

      return calculatedRoute;
    } catch (error) {
      this.logger.error(`Failed to calculate ORS route: ${error}`);
      throw error;
    }
  }
}
