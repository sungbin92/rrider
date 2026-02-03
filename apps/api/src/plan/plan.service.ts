import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@packages/db';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PlanService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    title: string;
    rideDate: Date;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    userId: string;
    waypoints?: Array<{ lat: number; lng: number }>;
    route?: {
      distance: number;
      duration: number;
      polyline: string;
    };
  }) {
    const { route, ...planData } = data;

    return this.prisma.client.plan.create({
      data: {
        ...planData,
        waypoints: planData.waypoints ?? Prisma.JsonNull,
        route: route
          ? {
              create: route,
            }
          : undefined,
      },
    });
  }

  async findOne<T extends Prisma.PlanInclude>(
    id: string,
    include?: T,
    userId?: string,
  ) {
    const plan = await this.prisma.client.plan.findUnique({
      where: { id },
      include,
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (userId && plan.userId && plan.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return plan as Prisma.PlanGetPayload<{ include: T }>;
  }

  findAll(userId: string) {
    return this.prisma.client.plan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        rideDate: true,
        startLat: true,
        startLng: true,
        endLat: true,
        endLng: true,
        createdAt: true,
        route: {
          select: {
            distance: true,
            duration: true,
          },
        },
      },
    });
  }
}
