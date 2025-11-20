import { Test, TestingModule } from '@nestjs/testing';
import { GoogleOauthService } from './google-oauth.service';
import { ConfigService } from '@nestjs/config';

describe('GoogleOauthService', () => {
  let service: GoogleOauthService;
  const configServiceMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleOauthService,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<GoogleOauthService>(GoogleOauthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
