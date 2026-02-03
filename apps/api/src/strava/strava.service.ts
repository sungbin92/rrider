import { Injectable, Logger } from '@nestjs/common';
import polylineModule from '@mapbox/polyline';
import { StravaClient } from './strava.client';
import { BoundingBox, StravaExploreSegment } from './strava.types';

const polyline = polylineModule as { decode(str: string): [number, number][] };

const WINDOW_KM = 10;
const BBOX_PADDING_DEG = 0.01; // ~1km padding around the route window
const CALL_DELAY_MS = 100;

@Injectable()
export class StravaService {
  private readonly logger = new Logger(StravaService.name);

  constructor(private readonly stravaClient: StravaClient) {}

  /**
   * Explore segments along a route polyline.
   * Splits the route into ~10km windows and queries each bounding box.
   * Returns deduplicated segments.
   */
  async exploreAlongRoute(
    encodedPolyline: string,
  ): Promise<StravaExploreSegment[]> {
    const coordinates = polyline.decode(encodedPolyline); // [lat, lng][]
    const windows = this.splitIntoWindows(coordinates, WINDOW_KM);

    this.logger.log(
      `Route split into ${windows.length} windows (~${WINDOW_KM}km each)`,
    );

    const seen = new Set<number>();
    const segments: StravaExploreSegment[] = [];

    for (const window of windows) {
      const bbox = this.toBoundingBox(window);

      try {
        const result = await this.stravaClient.exploreSegments(bbox);

        for (const seg of result.segments) {
          if (!seen.has(seg.id)) {
            seen.add(seg.id);
            segments.push(seg);
          }
        }
      } catch (error: any) {
        this.logger.warn(
          `Failed to explore segments for window: ${error.message}`,
        );
      }

      // Rate limit delay between calls
      if (windows.length > 1) {
        await this.delay(CALL_DELAY_MS);
      }
    }

    this.logger.log(
      `Found ${segments.length} unique segments across ${windows.length} windows`,
    );

    return segments;
  }

  /**
   * Get detailed information for a specific segment.
   */
  async getSegmentDetail(segmentId: number) {
    return this.stravaClient.getSegmentDetail(segmentId);
  }

  /**
   * Split polyline coordinates into windows of approximately `windowKm` km.
   */
  private splitIntoWindows(
    coordinates: [number, number][],
    windowKm: number,
  ): [number, number][][] {
    if (coordinates.length < 2) return [coordinates];

    const windows: [number, number][][] = [];
    let currentWindow: [number, number][] = [coordinates[0]];
    let distanceInWindow = 0;

    for (let i = 1; i < coordinates.length; i++) {
      const d = this.haversineKm(coordinates[i - 1], coordinates[i]);
      distanceInWindow += d;
      currentWindow.push(coordinates[i]);

      if (distanceInWindow >= windowKm) {
        windows.push(currentWindow);
        // Start new window overlapping with last point
        currentWindow = [coordinates[i]];
        distanceInWindow = 0;
      }
    }

    // Add remaining points
    if (currentWindow.length >= 2) {
      windows.push(currentWindow);
    } else if (currentWindow.length === 1 && windows.length > 0) {
      // Append single trailing point to last window
      windows[windows.length - 1].push(currentWindow[0]);
    }

    return windows;
  }

  private toBoundingBox(coordinates: [number, number][]): BoundingBox {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const [lat, lng] of coordinates) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }

    return {
      swLat: minLat - BBOX_PADDING_DEG,
      swLng: minLng - BBOX_PADDING_DEG,
      neLat: maxLat + BBOX_PADDING_DEG,
      neLng: maxLng + BBOX_PADDING_DEG,
    };
  }

  private haversineKm(
    a: [number, number],
    b: [number, number],
  ): number {
    const R = 6371;
    const dLat = this.toRad(b[0] - a[0]);
    const dLng = this.toRad(b[1] - a[1]);
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const h =
      sinLat * sinLat +
      Math.cos(this.toRad(a[0])) * Math.cos(this.toRad(b[0])) * sinLng * sinLng;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
