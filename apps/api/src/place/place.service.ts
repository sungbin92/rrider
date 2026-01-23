import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

// Place {
//   name: place_name
//   category: 마지막 카테고리
//   lat: y
//   lng: x
//   address: road_address_name
//   source: KAKAO
// }

@Injectable()
export class PlaceService {
  constructor(private readonly prisma: PrismaService) {}

  async searchAndSave(planId: string) {
    const plan = await this.prisma.client.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    const { endLat, endLng } = plan;

    const response = await axios.get(
      'https://dapi.kakao.com/v2/local/search/keyword.json',
      {
        headers: {
          Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
        },
        params: {
          query: '맛집',
          x: endLng,
          y: endLat,
          radius: 1000,
          size: 15,
        },
      },
    );
    const places = response.data.documents.map((doc: any) => ({
      planId,
      name: doc.place_name,
      category: doc.category_name.split('>').pop()?.trim(),
      lat: Number(doc.y),
      lng: Number(doc.x),
      address: doc.road_address_name,
      source: 'KAKAO',
    }));
    await this.prisma.client.place.deleteMany({
      where: { planId },
    });

    return this.prisma.client.place.createMany({
      data: places,
    });
  }
  findByPlan(planId: string) {
    return this.prisma.client.place.findMany({
      where: { planId },
    });
  }
}
