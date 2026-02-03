import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StravaService } from '../strava/strava.service';
import { StravaExploreSegment } from '../strava/strava.types';

@Injectable()
export class SegmentService {
  private readonly logger = new Logger(SegmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stravaService: StravaService,
  ) {}

  /**
   * Search for Strava segments along the plan's route and save them.
   */
  async searchAndSave(planId: string) {
    const plan = await this.prisma.client.plan.findUnique({
      where: { id: planId },
      include: { route: true },
    });

    if (!plan) throw new NotFoundException('Plan not found');
    if (!plan.route) throw new NotFoundException('Route not found. Calculate route first.');

    const routeId = plan.route.id;

    const segments = await this.stravaService.exploreAlongRoute(
      plan.route.polyline,
    );

    this.logger.log(`Saving ${segments.length} segments for route ${routeId}`);

    // Delete existing segments for this route before saving new ones
    await this.prisma.client.segment.deleteMany({
      where: { routeId },
    });

    if (segments.length === 0) {
      return { count: 0, segments: [] };
    }

    const data = segments.map((seg: StravaExploreSegment) => ({
      routeId,
      stravaId: seg.id,
      name: seg.name,
      climbCategory: seg.climb_category,
      avgGrade: seg.avg_grade,
      startLat: seg.start_latlng[0],
      startLng: seg.start_latlng[1],
      endLat: seg.end_latlng[0],
      endLng: seg.end_latlng[1],
      elevDifference: seg.elev_difference,
      distance: seg.distance,
      polyline: seg.points || null,
    }));

    await this.prisma.client.segment.createMany({ data });

    const saved = await this.prisma.client.segment.findMany({
      where: { routeId },
      orderBy: { distance: 'desc' },
    });

    return { count: saved.length, segments: saved };
  }

  /**
   * Get saved segments for a plan's route.
   */
  async findByPlan(planId: string) {
    const plan = await this.prisma.client.plan.findUnique({
      where: { id: planId },
      include: { route: true },
    });

    if (!plan) throw new NotFoundException('Plan not found');
    if (!plan.route) return [];

    return this.prisma.client.segment.findMany({
      where: { routeId: plan.route.id },
      orderBy: { distance: 'desc' },
    });
  }

  /**
   * Enrich a segment with detailed data from Strava (effort/athlete/star counts).
   */
  async enrich(segmentId: string) {
    const segment = await this.prisma.client.segment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) throw new NotFoundException('Segment not found');

    const detail = await this.stravaService.getSegmentDetail(segment.stravaId);

    return this.prisma.client.segment.update({
      where: { id: segmentId },
      data: {
        effortCount: detail.effort_count,
        athleteCount: detail.athlete_count,
        starCount: detail.star_count,
        polyline: detail.map?.polyline || segment.polyline,
      },
    });
  }
}
