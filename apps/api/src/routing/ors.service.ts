import { Injectable, Logger } from '@nestjs/common';
import { ORSClient, CyclingProfile } from './ors.client';
import polylineModule from '@mapbox/polyline';

const polyline = polylineModule as {
  decode(str: string): [number, number][];
  encode(coords: [number, number][]): string;
};

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteInstruction {
  distance: number;
  time: number;
  text: string;
  street_name: string;
}

export interface CalculatedRoute {
  distance: number; // meters
  duration: number; // seconds
  polyline: string; // encoded polyline (Google format, precision 5)
  instructions: RouteInstruction[];
  snappedWaypoints: [number, number][]; // [lat, lng] pairs
}

@Injectable()
export class ORSService {
  private readonly logger = new Logger(ORSService.name);

  constructor(private readonly orsClient: ORSClient) {}

  async calculateRoute(
    start: RoutePoint,
    end: RoutePoint,
    waypoints: RoutePoint[] = [],
    profile: CyclingProfile = 'cycling-regular',
  ): Promise<CalculatedRoute> {
    // Build points array: start -> waypoints -> end
    // ORS expects [lng, lat] format
    const points: [number, number][] = [
      [start.lng, start.lat],
      ...waypoints.map((wp) => [wp.lng, wp.lat] as [number, number]),
      [end.lng, end.lat],
    ];

    this.logger.log(
      `Calculating ORS route with ${points.length} points using profile: ${profile}`,
    );

    const response = await this.orsClient.route(points, profile);

    if (!response.routes || response.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = response.routes[0];

    // ORS returns geometry as encoded polyline (Google polyline format, precision 5)
    // We need to decode and re-encode to ensure compatibility
    const decodedCoords = polyline.decode(route.geometry);

    // Collect instructions from all segments
    const instructions: RouteInstruction[] = [];
    for (const segment of route.segments) {
      for (const step of segment.steps) {
        instructions.push({
          distance: step.distance,
          time: step.duration,
          text: step.instruction,
          street_name: step.name,
        });
      }
    }

    // Extract snapped waypoints from way_points indices
    // way_points contains the indices in the geometry array
    const snappedWaypoints: [number, number][] = route.way_points.map(
      (wpIndex) => {
        const coord = decodedCoords[wpIndex];
        return [coord[0], coord[1]]; // [lat, lng]
      },
    );

    return {
      distance: route.summary.distance,
      duration: route.summary.duration,
      polyline: route.geometry,
      instructions,
      snappedWaypoints,
    };
  }
}
