import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleOauthService } from 'src/google-oauth/google-oauth.service';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    googleLogin: jest.fn(),
    validateToken: jest.fn(),
  };
  const googleOauthServiceMock = {
    getAuthUrl: jest.fn(),
  };
  const authGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };
  const jwtServiceMock = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: GoogleOauthService, useValue: googleOauthServiceMock },
        { provide: AuthGuard, useValue: authGuardMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
