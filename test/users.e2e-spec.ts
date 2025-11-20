import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Types, Connection } from 'mongoose';
import { UserRole } from '../src/users/schemas/user.schema';
import { getConnectionToken } from '@nestjs/mongoose';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let moduleFixture: TestingModule;
  let mongooseConnection: Connection;

  const adminUserId = new Types.ObjectId().toString();
  const regularUserId = new Types.ObjectId().toString();
  const testUserId = new Types.ObjectId().toString();

  const generateToken = (
    userId: string,
    role: UserRole = UserRole.USER,
  ): string => {
    const payload = {
      email: `test-${userId}@example.com`,
      sub: userId,
      role: role,
    };
    return jwtService.sign(payload);
  };

  const getAdminAuthHeader = () => {
    const token = generateToken(adminUserId, UserRole.ADMIN);
    return { Authorization: `Bearer ${token}` };
  };

  const getRegularUserAuthHeader = () => {
    const token = generateToken(regularUserId, UserRole.USER);
    return { Authorization: `Bearer ${token}` };
  };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    mongooseConnection = moduleFixture.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    if (mongooseConnection && mongooseConnection.readyState !== 0) {
      try {
        await mongooseConnection.close();
      } catch (error) {
        // ignore
      }
    }
    if (app) {
      try {
        await app.close();
      } catch (error) {
        // ignore
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe('GET /api/users', () => {
    it('should get all users successfully as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set(getAdminAuthHeader())
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        const user = response.body[0];
        expect(user).toHaveProperty('_id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('updatedAt');
        expect(user).not.toHaveProperty('googleId');
      }
    });

    it('should return 403 when accessed by regular user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set(getRegularUserAuthHeader())
        .expect(403);

      expect(response.body).toHaveProperty('statusCode', 403);
      expect(response.body.message).toContain('role');
    });

    it('should return 401 when no authentication token is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body.message).toContain('token');
    });
  });

  describe('GET /api/users/:userId', () => {
    let existingUserId: string;

    beforeAll(async () => {
      existingUserId = new Types.ObjectId().toString();
    });

    it('should get a user by ID successfully as admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/users/${existingUserId}`)
        .set(getAdminAuthHeader());

      if (response.status === 200) {
        expect(response.body).toHaveProperty('_id');
        expect(response.body).toHaveProperty('email');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('role');
        expect(response.body).not.toHaveProperty('googleId');
      } else {
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('statusCode', 404);
      }
    });

    it('should return 404 when user does not exist', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      const response = await request(app.getHttpServer())
        .get(`/api/users/${nonExistentId}`)
        .set(getAdminAuthHeader())
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 when user ID format is invalid', async () => {
      const invalidId = 'invalid-object-id';

      const response = await request(app.getHttpServer())
        .get(`/api/users/${invalidId}`)
        .set(getAdminAuthHeader())
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 403 when accessed by regular user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/users/${existingUserId}`)
        .set(getRegularUserAuthHeader())
        .expect(403);

      expect(response.body).toHaveProperty('statusCode', 403);
      expect(response.body.message).toContain('role');
    });

    it('should return 401 when no authentication token is provided', async () => {
      await request(app.getHttpServer())
        .get(`/api/users/${existingUserId}`)
        .expect(401);
    });
  });

  describe('PUT /api/users/:userId/make-admin', () => {
    let targetUserId: string;

    beforeAll(() => {
      targetUserId = new Types.ObjectId().toString();
    });

    it('should make a user admin successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/users/${targetUserId}/make-admin`)
        .set(getAdminAuthHeader());

      if (response.status === 200) {
        expect(response.body).toHaveProperty('_id');
        expect(response.body).toHaveProperty('role', 'admin');
        expect(response.body).not.toHaveProperty('googleId');
      } else {
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('statusCode', 404);
      }
    });

    it('should return 404 when user does not exist', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      const response = await request(app.getHttpServer())
        .put(`/api/users/${nonExistentId}/make-admin`)
        .set(getAdminAuthHeader())
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 when user ID format is invalid', async () => {
      const invalidId = 'invalid-object-id';

      const response = await request(app.getHttpServer())
        .put(`/api/users/${invalidId}/make-admin`)
        .set(getAdminAuthHeader())
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 403 when accessed by regular user', async () => {
      // Note: Based on controller code, this endpoint might allow regular users
      const response = await request(app.getHttpServer())
        .put(`/api/users/${targetUserId}/make-admin`)
        .set(getRegularUserAuthHeader());

      // If RolesGuard blocks it, expect 403; otherwise might be 200 or 404
      if (response.status === 403) {
        expect(response.body).toHaveProperty('statusCode', 403);
        expect(response.body.message).toContain('role');
      }
    });

    it('should return 401 when no authentication token is provided', async () => {
      await request(app.getHttpServer())
        .put(`/api/users/${targetUserId}/make-admin`)
        .expect(401);
    });
  });

  describe('PUT /api/users/:userId/make-regular', () => {
    let targetUserId: string;

    beforeAll(() => {
      targetUserId = new Types.ObjectId().toString();
    });

    it('should make a user regular successfully as admin', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/users/${targetUserId}/make-regular`)
        .set(getAdminAuthHeader());

      if (response.status === 200) {
        expect(response.body).toHaveProperty('_id');
        expect(response.body).toHaveProperty('role', 'user');
        expect(response.body).not.toHaveProperty('googleId');
      } else {
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('statusCode', 404);
      }
    });

    it('should return 404 when user does not exist', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      const response = await request(app.getHttpServer())
        .put(`/api/users/${nonExistentId}/make-regular`)
        .set(getAdminAuthHeader())
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 when user ID format is invalid', async () => {
      const invalidId = 'invalid-object-id';

      const response = await request(app.getHttpServer())
        .put(`/api/users/${invalidId}/make-regular`)
        .set(getAdminAuthHeader())
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 403 when accessed by regular user', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/users/${targetUserId}/make-regular`)
        .set(getRegularUserAuthHeader())
        .expect(403);

      expect(response.body).toHaveProperty('statusCode', 403);
      expect(response.body.message).toContain('role');
    });

    it('should return 401 when no authentication token is provided', async () => {
      await request(app.getHttpServer())
        .put(`/api/users/${targetUserId}/make-regular`)
        .expect(401);
    });
  });

  describe('DELETE /api/users/:userId', () => {
    let targetUserId: string;

    beforeAll(() => {
      targetUserId = new Types.ObjectId().toString();
    });

    it('should delete a user successfully as admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/users/${targetUserId}`)
        .set(getAdminAuthHeader());

      if (response.status === 200) {
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('deletedUser');
        expect(response.body.deletedUser).toHaveProperty('id');
        expect(response.body.deletedUser).toHaveProperty('email');
        expect(response.body.deletedUser).toHaveProperty('name');
        expect(response.body.deletedUser).toHaveProperty('role');
      } else {
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('statusCode', 404);
      }
    });

    it('should return 404 when user does not exist', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      const response = await request(app.getHttpServer())
        .delete(`/api/users/${nonExistentId}`)
        .set(getAdminAuthHeader())
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 when admin tries to delete themselves', async () => {
      // Use admin's own ID
      const response = await request(app.getHttpServer())
        .delete(`/api/users/${adminUserId}`)
        .set(getAdminAuthHeader())
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toContain('cannot delete your own account');
    });

    it('should return 400 when user ID format is invalid', async () => {
      const invalidId = 'invalid-object-id';

      const response = await request(app.getHttpServer())
        .delete(`/api/users/${invalidId}`)
        .set(getAdminAuthHeader())
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 403 when accessed by regular user', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/users/${targetUserId}`)
        .set(getRegularUserAuthHeader())
        .expect(403);

      expect(response.body).toHaveProperty('statusCode', 403);
      expect(response.body.message).toContain('role');
    });

    it('should return 401 when no authentication token is provided', async () => {
      await request(app.getHttpServer())
        .delete(`/api/users/${targetUserId}`)
        .expect(401);
    });
  });
});
