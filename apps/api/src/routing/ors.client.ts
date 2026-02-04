import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type CyclingProfile =
  | 'cycling-regular'
  | 'cycling-road'
  | 'cycling-mountain'
  | 'cycling-electric';

export interface ORSRouteRequest {
  coordinates: [number, number][]; // [lng, lat] pairs
  profile: CyclingProfile;
  language?: string;
  instructions?: boolean;
}

export interface ORSInstruction {
  distance: number;
  duration: number;
  type: number;
  instruction: string;
  name: string;
  way_points: [number, number];
  exit_number?: number;
}

export interface ORSSegment {
  distance: number;
  duration: number;
  steps: ORSInstruction[];
}

export interface ORSRoute {
  summary: {
    distance: number; // meters
    duration: number; // seconds
  };
  segments: ORSSegment[];
  geometry: string; // encoded polyline
  way_points: number[];
  bbox: [number, number, number, number];
}

export interface ORSRouteResponse {
  routes: ORSRoute[];
  bbox: [number, number, number, number];
  metadata: {
    attribution: string;
    service: string;
    timestamp: number;
    query: {
      coordinates: [number, number][];
      profile: string;
    };
  };
}

export interface ORSErrorResponse {
  error: {
    code: number;
    message: string;
  };
}

@Injectable()
export class ORSClient {
  private readonly logger = new Logger(ORSClient.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openrouteservice.org/v2';

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('OPENROUTE_SERVICE_API_KEY') || '';
  }

  async route(
    points: [number, number][], // [lng, lat] pairs
    profile: CyclingProfile = 'cycling-regular',
  ): Promise<ORSRouteResponse> {
    const url = `${this.baseUrl}/directions/${profile}`;

    this.logger.log(
      `Requesting ORS route with ${points.length} points, profile: ${profile}`,
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json',
        Authorization: this.apiKey,
      },
      body: JSON.stringify({
        coordinates: points,
        instructions: true,
        language: 'en',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`ORS API error (${response.status}): ${errorText}`);
      throw new Error(`ORS API error: ${errorText}`);
    }

    const data = (await response.json()) as ORSRouteResponse;
    return data;
  }
}
