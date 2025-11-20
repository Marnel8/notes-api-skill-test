import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GoogleOauthService {
  private readonly logger = new Logger(GoogleOauthService.name);

  constructor(private configService: ConfigService) {}

  getAuthUrl(): string {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get('GOOGLE_CALLBACK_URL');

    // Validate configuration
    if (!clientId || !redirectUri) {
      this.logger.error('Missing Google OAuth configuration');
      throw new Error('Google OAuth is not properly configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async getTokens(code: string): Promise<any> {
    try {
      const body = new URLSearchParams({
        client_id: this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '',
        client_secret:
          this.configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
        code,
        grant_type: 'authorization_code',
        redirect_uri:
          this.configService.get<string>('GOOGLE_CALLBACK_URL') ?? '',
      });

      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        body.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Token exchange error', error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error_description || error.message
        : error instanceof Error
          ? error.message
          : 'Failed to exchange code for tokens';
      throw new UnauthorizedException(message);
    }
  }

  async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Google user info error', error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error_description || error.message
        : error instanceof Error
          ? error.message
          : 'Failed to fetch user info from Google';
      throw new UnauthorizedException(message);
    }
  }

  async validateGoogleUser(code: string): Promise<any> {
    const tokens = await this.getTokens(code);
    const userInfo = await this.getUserInfo(tokens.access_token);

    if (!userInfo.verified_email) {
      throw new UnauthorizedException('Google email not verified');
    }

    return userInfo;
  }
}
