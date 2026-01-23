import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';

@Injectable()
export class RouteService {
  constructor(private readonly prisma: PrismaService) {}

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
}
