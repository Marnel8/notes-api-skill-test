import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { GoogleOauthService } from 'src/google-oauth/google-oauth.service';

describe('AuthService', () => {
  let service: AuthService;
  const usersServiceMock = {
    findOrCreate: jest.fn(),
    findById: jest.fn(),
  };
  const jwtServiceMock = {
    sign: jest.fn(),
  };
  const googleOauthServiceMock = {
    validateGoogleUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: GoogleOauthService, useValue: googleOauthServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
