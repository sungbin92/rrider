import { Injectable } from '@nestjs/common';
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
  }) {
    return this.prisma.client.plan.create({
      data,
    });
  }

  findOne(id: string) {
    return this.prisma.client.plan.findUnique({
      where: { id },
    });
  }
}
