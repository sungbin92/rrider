import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { StravaTokenService } from './strava-token.service';
import {
  BoundingBox,
  StravaExploreResponse,
  StravaSegmentDetail,
} from './strava.types';

@Injectable()
export class StravaClient {
  private readonly logger = new Logger(StravaClient.name);
  private readonly client: AxiosInstance;

  constructor(private readonly tokenService: StravaTokenService) {
    this.client = axios.create({
      baseURL: 'https://www.strava.com/api/v3',
      timeout: 15000,
    });
  }

  async exploreSegments(bounds: BoundingBox): Promise<StravaExploreResponse> {
    const accessToken = await this.tokenService.getAccessToken();

    const boundsParam = `${bounds.swLat},${bounds.swLng},${bounds.neLat},${bounds.neLng}`;

    this.logger.log(`Exploring segments in bounds: ${boundsParam}`);

    const response = await this.client.get<StravaExploreResponse>(
      '/segments/explore',
      {
        params: {
          bounds: boundsParam,
          activity_type: 'riding',
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    return response.data;
  }

  async getSegmentDetail(segmentId: number): Promise<StravaSegmentDetail> {
    const accessToken = await this.tokenService.getAccessToken();

    this.logger.log(`Fetching segment detail: ${segmentId}`);

    const response = await this.client.get<StravaSegmentDetail>(
      `/segments/${segmentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    return response.data;
  }
}
