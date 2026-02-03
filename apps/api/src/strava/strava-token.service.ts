import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { StravaTokenResponse } from './strava.types';

@Injectable()
export class StravaTokenService {
  private readonly logger = new Logger(StravaTokenService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.clientId = this.configService.get<string>('STRAVA_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('STRAVA_CLIENT_SECRET') || '';
    this.redirectUri =
      this.configService.get<string>('STRAVA_REDIRECT_URI') ||
      'http://localhost:3001/strava/callback';
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'read',
    });
    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<void> {
    const response = await axios.post<StravaTokenResponse>(
      'https://www.strava.com/oauth/token',
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
      },
    );

    const { access_token, refresh_token, expires_at } = response.data;

    // Upsert: keep only one token row (app-level single token)
    const existing = await this.prisma.client.stravaToken.findFirst();
    if (existing) {
      await this.prisma.client.stravaToken.update({
        where: { id: existing.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: expires_at,
        },
      });
    } else {
      await this.prisma.client.stravaToken.create({
        data: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: expires_at,
        },
      });
    }

    this.logger.log('Strava token saved successfully');
  }

  async getAccessToken(): Promise<string> {
    const token = await this.prisma.client.stravaToken.findFirst();
    if (!token) {
      throw new Error(
        'No Strava token found. Please authorize via /strava/auth first.',
      );
    }

    const now = Math.floor(Date.now() / 1000);
    if (token.expiresAt < now + 60) {
      return this.refreshAccessToken(token.id, token.refreshToken);
    }

    return token.accessToken;
  }

  private async refreshAccessToken(
    tokenId: string,
    refreshToken: string,
  ): Promise<string> {
    this.logger.log('Refreshing Strava access token');

    const response = await axios.post<StravaTokenResponse>(
      'https://www.strava.com/oauth/token',
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      },
    );

    const { access_token, refresh_token, expires_at } = response.data;

    await this.prisma.client.stravaToken.update({
      where: { id: tokenId },
      data: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_at,
      },
    });

    return access_token;
  }
}
