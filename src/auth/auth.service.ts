import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GoogleOauthService } from 'src/google-oauth/google-oauth.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private googleOAuth: GoogleOauthService,
  ) {}

  async googleLogin(code: string) {
    try {
      const googleUser = await this.googleOAuth.validateGoogleUser(code);

      const user = await this.userService.findOrCreate(googleUser);

      const payload = {
        email: user.email,
        sub: user.id,
        role: user.role,
      };

      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        token_type: 'Bearer',
        expiresIn: '7d',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          picture: user.picture,
        },
      };
    } catch (error) {
      this.logger.error('Google login failed', error);
      const message =
        error instanceof UnauthorizedException
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Authentication failed';
      throw new UnauthorizedException(message);
    }
  }

  async validateUser(payload: any) {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
