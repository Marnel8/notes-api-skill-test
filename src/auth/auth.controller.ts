import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleOauthService } from 'src/google-oauth/google-oauth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private googleOAuth: GoogleOauthService,
  ) {}

  @Get('google')
  getGoogleAuthUrl() {
    const url = this.googleOAuth.getAuthUrl();

    return {
      auth_url: url,
      message: 'Redirect users to this URL for Google authentication',
    };
  }

  @Post('google/callback')
  async googleCallback(@Body('code') code: string) {
    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }

    const decodedCode = decodeURIComponent(code);

    return this.authService.googleLogin(decodedCode.replace(/%2F/gi, '/'));
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  getProfile(@Request() req) {
    return { user: req.user };
  }

  @Post('validate')
  @UseGuards(AuthGuard)
  validateToken() {
    return { valid: true, message: 'Token is valid' };
  }
}
