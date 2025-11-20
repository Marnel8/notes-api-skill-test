import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleOauthService } from './google-oauth.service';

@Module({
  imports: [ConfigModule],
  providers: [GoogleOauthService],
  exports: [GoogleOauthService],
})
export class GoogleOauthModule {}
