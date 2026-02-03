import { Controller, Get, Logger, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { StravaTokenService } from './strava-token.service';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';

@Controller('strava')
export class StravaController {
  private readonly logger = new Logger(StravaController.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly tokenService: StravaTokenService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  @Public()
  @Get('auth')
  auth(@CurrentUser() user?: CurrentUserData) {
    // Pass userId as state if user is logged in
    const state = user?.id;
    const url = this.tokenService.getAuthUrl(state);
    this.logger.log(`Strava auth URL generated`);
    return { url };
  }

  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string | undefined,
    @Res() res: Response,
  ) {
    // state contains userId if the user was logged in when starting OAuth
    const result = await this.tokenService.exchangeCode(code, state);

    // Generate JWT tokens for the user
    const tokens = this.authService.generateTokensForUser(result.user);

    // Redirect to frontend with tokens
    const redirectUrl = new URL('/auth/callback', this.frontendUrl);
    redirectUrl.searchParams.set('accessToken', tokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);

    return res.redirect(redirectUrl.toString());
  }
}
