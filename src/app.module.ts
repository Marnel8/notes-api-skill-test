import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { NotesModule } from './notes/notes.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { UsersModule } from './users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { GoogleOauthService } from './google-oauth/google-oauth.service';
import { GoogleOauthModule } from './google-oauth/google-oauth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');

        if (!uri) {
          console.warn('MONGODB_URI is not set');
        }

        return {
          uri,
          connectionFactory: (connection: Connection) => {
            if (connection.readyState === 1) {
              console.log('Still Connected');
            }

            connection.on('connected', () => {
              console.log('Connection Established');
            });

            connection.on('error', (err) => {
              console.error('MongoDB connection error:', err);
            });

            connection.on('disconnected', () => {
              console.log('MongoDB disconnected');
            });

            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    NotesModule,
    UsersModule,
    GoogleOauthModule,
  ],
  controllers: [AppController],
  providers: [AppService, GoogleOauthService],
})
export class AppModule {}
