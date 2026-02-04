import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { create } from 'xmlbuilder2';
import polylineModule from '@mapbox/polyline';

// @mapbox/polyline has no TS types; decode(string) -> [lat,lng][]
const polyline = polylineModule as { decode(str: string): [number, number][] };

@Injectable()
export class GpxService {
  constructor(private readonly prisma: PrismaService) {}

  async generateGpx(planId: string, userId?: string): Promise<string> {
    const plan = await this.prisma.client.plan.findUnique({
      where: { id: planId },
      include: {
        route: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (userId && plan.userId && plan.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (!plan.route) {
      throw new NotFoundException('Route not found');
    }

    // GPX 문서 생성
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('gpx', {
        xmlns: 'http://www.topografix.com/GPX/1/1',
        version: '1.1',
        creator: 'Rider Planner',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation':
          'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd',
      })
      .ele('metadata')
      .ele('name')
      .txt(plan.title)
      .up()
      .ele('desc')
      .txt(`라이딩 플랜: ${plan.title}`)
      .up()
      .ele('time')
      .txt(new Date().toISOString())
      .up()
      .up();

    // Add snapped waypoints from GraphHopper (road-corrected waypoints)
    const snappedWaypoints = plan.route.snappedWaypoints as
      | [number, number][]
      | null;
    if (snappedWaypoints && snappedWaypoints.length > 0) {
      // First point is start, last is end, middle points are waypoints
      snappedWaypoints.forEach((coord, index) => {
        const [lat, lng] = coord;
        const wpt = doc.ele('wpt', {
          lat: lat.toFixed(6),
          lon: lng.toFixed(6),
        });

        if (index === 0) {
          wpt.ele('name').txt('출발지');
          wpt.ele('desc').txt('라이딩 출발 지점');
          wpt.ele('sym').txt('Flag, Green');
        } else if (index === snappedWaypoints.length - 1) {
          wpt.ele('name').txt('도착지');
          wpt.ele('desc').txt('라이딩 도착 지점');
          wpt.ele('sym').txt('Flag, Red');
        } else {
          wpt.ele('name').txt(`경유지 ${index}`);
          wpt.ele('desc').txt('중간 경유지 (도로 보정됨)');
          wpt.ele('sym').txt('Flag, Blue');
        }
      });
    } else if (plan.waypoints) {
      // Fallback to original waypoints if no snapped waypoints
      const waypoints = plan.waypoints as Array<{ lat: number; lng: number }>;
      waypoints.forEach((waypoint, index) => {
        const wpt = doc.ele('wpt', {
          lat: waypoint.lat.toFixed(6),
          lon: waypoint.lng.toFixed(6),
        });
        wpt.ele('name').txt(`경유지 ${index + 1}`);
        wpt.ele('desc').txt('중간 경유지');
        wpt.ele('sym').txt('Flag, Blue');
      });
    }

    // 트랙 생성
    const trk = doc.ele('trk');
    trk.ele('name').txt(plan.title);
    trk.ele('desc').txt(`라이딩 거리: ${(plan.route.distance / 1000).toFixed(1)}km`);

    const trkseg = trk.ele('trkseg');

    // Polyline 디코딩 ([lat, lng][] — @mapbox/polyline has no types)
    const coordinates = polyline.decode(plan.route.polyline);

    // 시작 시간 계산 (라이딩 시작 시간 가정)
    const startTime = new Date(plan.rideDate);
    const totalTime = plan.route.duration; // 초 단위
    const coordinateCount = coordinates.length;

    // 각 좌표에 대한 시간 간격 계산
    const timeInterval = totalTime / coordinateCount;

    // 트랙 포인트 추가
    coordinates.forEach((coord, index) => {
      const [lat, lng] = coord;
      const time = new Date(startTime.getTime() + index * timeInterval * 1000);

      const trkpt = trkseg.ele('trkpt', {
        lat: lat.toFixed(6),
        lon: lng.toFixed(6),
      });

      trkpt.ele('time').txt(time.toISOString());
    });

    return doc.end({ prettyPrint: true });
  }
}
