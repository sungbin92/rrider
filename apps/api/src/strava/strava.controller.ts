import { Controller, Get, Logger, Query } from '@nestjs/common';
import { StravaTokenService } from './strava-token.service';

@Controller('strava')
export class StravaController {
  private readonly logger = new Logger(StravaController.name);

  constructor(private readonly tokenService: StravaTokenService) {}

  @Get('auth')
  auth() {
    const url = this.tokenService.getAuthUrl();
    this.logger.log(`Strava auth URL generated`);
    return { url };
  }

  @Get('callback')
  async callback(@Query('code') code: string) {
    await this.tokenService.exchangeCode(code);
    return { message: 'Strava authorization successful. Token saved.' };
  }
}
