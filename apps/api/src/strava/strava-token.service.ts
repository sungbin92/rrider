import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { StravaTokenResponse } from './strava.types';

export interface StravaExchangeResult {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  stravaAthleteId: number;
}

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

  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'read',
    });
    if (state) {
      params.set('state', state);
    }
    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, userId?: string): Promise<StravaExchangeResult> {
    const response = await axios.post<StravaTokenResponse>(
      'https://www.strava.com/oauth/token',
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
      },
    );

    const { access_token, refresh_token, expires_at, athlete } = response.data;
    const stravaAthleteId = athlete.id;

    let user: { id: string; email: string; name: string | null };

    if (userId) {
      // User is already logged in, link Strava to their account
      user = await this.linkStravaToUser(userId, {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_at,
        stravaAthleteId,
      });
    } else {
      // Check if we have an existing user with this Strava athlete ID
      const existingToken = await this.prisma.client.stravaToken.findFirst({
        where: { stravaAthleteId },
        include: { user: true },
      });

      if (existingToken?.user) {
        // Update existing token
        await this.prisma.client.stravaToken.update({
          where: { id: existingToken.id },
          data: {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: expires_at,
          },
        });
        user = existingToken.user;
      } else {
        // Create new user via Strava OAuth
        const athleteName = `${athlete.firstname} ${athlete.lastname}`.trim();
        user = await this.createUserWithStrava({
          name: athleteName || null,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: expires_at,
          stravaAthleteId,
        });
      }
    }

    this.logger.log(`Strava token saved for user ${user.id}`);

    return { user, stravaAthleteId };
  }

  private async linkStravaToUser(
    userId: string,
    tokenData: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      stravaAthleteId: number;
    },
  ) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Upsert the Strava token for this user
    await this.prisma.client.stravaToken.upsert({
      where: { userId },
      create: {
        userId,
        stravaAthleteId: tokenData.stravaAthleteId,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
      },
      update: {
        stravaAthleteId: tokenData.stravaAthleteId,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
      },
    });

    return { id: user.id, email: user.email, name: user.name };
  }

  private async createUserWithStrava(data: {
    name: string | null;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    stravaAthleteId: number;
  }) {
    // Create user with a placeholder email (Strava doesn't provide email)
    const email = `strava_${data.stravaAthleteId}@oauth.local`;

    const user = await this.prisma.client.user.create({
      data: {
        email,
        name: data.name,
        stravaTokens: {
          create: {
            stravaAthleteId: data.stravaAthleteId,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
          },
        },
      },
    });

    return { id: user.id, email: user.email, name: user.name };
  }

  async getAccessToken(userId?: string): Promise<string> {
    const token = userId
      ? await this.prisma.client.stravaToken.findUnique({ where: { userId } })
      : await this.prisma.client.stravaToken.findFirst();

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

    const { access_token, refresh_token, expires_at, athlete } = response.data;

    await this.prisma.client.stravaToken.update({
      where: { id: tokenId },
      data: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_at,
        stravaAthleteId: athlete?.id,
      },
    });

    return access_token;
  }
}
