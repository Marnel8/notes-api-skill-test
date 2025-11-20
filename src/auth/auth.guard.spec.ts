import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('AuthGuard', () => {
  it('should be defined', () => {
    const jwtServiceMock = {} as JwtService;
    expect(new AuthGuard(jwtServiceMock)).toBeDefined();
  });
});
