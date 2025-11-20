import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Types, Connection } from 'mongoose';
import { UserRole } from '../src/users/schemas/user.schema';
import { getConnectionToken } from '@nestjs/mongoose';

describe('NotesController (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let moduleFixture: TestingModule;
  let mongooseConnection: Connection;

  const testUserId = new Types.ObjectId().toString();
  const testUser2Id = new Types.ObjectId().toString();

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

  const getAuthHeader = (
    userId: string = testUserId,
    role: UserRole = UserRole.USER,
  ) => {
    const token = generateToken(userId, role);
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

  describe('POST /api/notes', () => {
    it('should create a note successfully with valid payload', async () => {
      const createNoteDto = {
        title: 'Test Note Title',
        content: 'This is the content of the test note',
        tags: ['test', 'e2e'],
        category: 'testing',
      };

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .set(getAuthHeader())
        .send(createNoteDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('title', createNoteDto.title);
      expect(response.body).toHaveProperty('content', createNoteDto.content);
      expect(response.body).toHaveProperty('tags', createNoteDto.tags);
      expect(response.body).toHaveProperty('category', createNoteDto.category);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body.user).toBe(testUserId);
    });

    it('should create a note with minimal required fields', async () => {
      const createNoteDto = {
        title: 'Minimal Note',
        content: 'Minimal content',
      };

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .set(getAuthHeader())
        .send(createNoteDto)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(createNoteDto.title);
      expect(response.body.content).toBe(createNoteDto.content);
      expect(response.body.category).toBe('general'); // Default category
    });

    it('should return 400 when title is missing', async () => {
      const createNoteDto = {
        content: 'Content without title',
      };

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .set(getAuthHeader())
        .send(createNoteDto)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
      expect(
        response.body.message.some((msg: string) => msg.includes('title')),
      ).toBe(true);
    });

    it('should return 400 when content is missing', async () => {
      const createNoteDto = {
        title: 'Title without content',
      };

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .set(getAuthHeader())
        .send(createNoteDto)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
      expect(
        response.body.message.some((msg: string) => msg.includes('content')),
      ).toBe(true);
    });

    it('should return 400 when title is empty string', async () => {
      const createNoteDto = {
        title: '',
        content: 'Valid content',
      };

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .set(getAuthHeader())
        .send(createNoteDto)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(
        response.body.message.some(
          (msg: string) => msg.includes('title') || msg.includes('empty'),
        ),
      ).toBe(true);
    });

    it('should return 400 when content is empty string', async () => {
      const createNoteDto = {
        title: 'Valid title',
        content: '',
      };

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .set(getAuthHeader())
        .send(createNoteDto)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(
        response.body.message.some(
          (msg: string) => msg.includes('content') || msg.includes('empty'),
        ),
      ).toBe(true);
    });

    it('should return 400 when tags is not an array', async () => {
      const createNoteDto = {
        title: 'Valid title',
        content: 'Valid content',
        tags: 'not-an-array',
      };

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .set(getAuthHeader())
        .send(createNoteDto)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 when non-whitelisted fields are provided', async () => {
      const createNoteDto = {
        title: 'Valid title',
        content: 'Valid content',
        invalidField: 'should be rejected',
        anotherInvalid: 123,
      };

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .set(getAuthHeader())
        .send(createNoteDto)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(
        response.body.message.some(
          (msg: string) =>
            msg.includes('invalidField') ||
            msg.includes('anotherInvalid') ||
            msg.includes('property'),
        ),
      ).toBe(true);
    });

    it('should return 401 when no authentication token is provided', async () => {
      const createNoteDto = {
        title: 'Test Note',
        content: 'Test content',
      };

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .send(createNoteDto)
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body.message).toContain('token');
    });
  });

  describe('GET /api/notes', () => {
    let createdNoteId: string;

    beforeAll(async () => {
      const createNoteDto = {
        title: 'Note for GET test',
        content: 'Content for GET test',
        tags: ['get-test'],
        category: 'testing',
      };

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .set(getAuthHeader())
        .send(createNoteDto)
        .expect(201);

      createdNoteId = response.body._id;
    });

    it('should get all notes successfully with default pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/notes')
        .set(getAuthHeader())
        .expect(200);

      expect(response.body).toHaveProperty('notes');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(response.body).toHaveProperty('pages');
      expect(Array.isArray(response.body.notes)).toBe(true);
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.pages).toBe('number');
    });

    it('should get all notes with custom pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/notes')
        .query({ page: 1, limit: 5 })
        .set(getAuthHeader())
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.notes.length).toBeLessThanOrEqual(5);
    });

    it('should filter notes by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/notes')
        .query({ category: 'testing' })
        .set(getAuthHeader())
        .expect(200);

      expect(response.body).toHaveProperty('notes');
      // All returned notes should have the specified category
      response.body.notes.forEach((note: any) => {
        expect(note.category).toBe('testing');
      });
    });

    it('should filter notes by tag', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/notes')
        .query({ tag: 'get-test' })
        .set(getAuthHeader())
        .expect(200);

      expect(response.body).toHaveProperty('notes');
      // All returned notes should contain the specified tag
      response.body.notes.forEach((note: any) => {
        expect(note.tags).toContain('get-test');
      });
    });

    it('should return only notes belonging to the authenticated user', async () => {
      const otherUserToken = generateToken(testUser2Id);
      const otherUserNote = {
        title: 'Other user note',
        content: 'Other user content',
      };

      await request(app.getHttpServer())
        .post('/api/notes')
        .set({ Authorization: `Bearer ${otherUserToken}` })
        .send(otherUserNote)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/notes')
        .set(getAuthHeader())
        .expect(200);

      response.body.notes.forEach((note: any) => {
        expect(note.user).toBe(testUserId);
      });
    });

    it('should return 401 when no authentication token is provided', async () => {
      await request(app.getHttpServer()).get('/api/notes').expect(401);
    });
  });

  describe('GET /api/notes/:noteId', () => {
    let createdNoteId: string;
    let otherUserNoteId: string;

    beforeAll(async () => {
      const createNoteDto = {
        title: 'Note for GET by ID test',
        content: 'Content for GET by ID test',
      };

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .set(getAuthHeader())
        .send(createNoteDto)
        .expect(201);

      createdNoteId = response.body._id;

      const otherUserToken = generateToken(testUser2Id);
      const otherUserNote = {
        title: 'Other user note',
        content: 'Other user content',
      };

      const otherResponse = await request(app.getHttpServer())
        .post('/api/notes')
        .set({ Authorization: `Bearer ${otherUserToken}` })
        .send(otherUserNote)
        .expect(201);

      otherUserNoteId = otherResponse.body._id;
    });

    it('should get a note by ID successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/notes/${createdNoteId}`)
        .set(getAuthHeader())
        .expect(200);

      expect(response.body).toHaveProperty('_id', createdNoteId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('user', testUserId);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 404 when note does not exist', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      const response = await request(app.getHttpServer())
        .get(`/api/notes/${nonExistentId}`)
        .set(getAuthHeader())
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 when note ID format is invalid', async () => {
      const invalidId = 'invalid-object-id';

      const response = await request(app.getHttpServer())
        .get(`/api/notes/${invalidId}`)
        .set(getAuthHeader())
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 404 when note belongs to different user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/notes/${otherUserNoteId}`)
        .set(getAuthHeader())
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 401 when no authentication token is provided', async () => {
      await request(app.getHttpServer())
        .get(`/api/notes/${createdNoteId}`)
        .expect(401);
    });
  });

  describe('PUT /api/notes/:noteId', () => {
    let createdNoteId: string;
    let otherUserNoteId: string;

    beforeAll(async () => {
      const createNoteDto = {
        title: 'Note for UPDATE test',
        content: 'Original content',
        tags: ['original'],
        category: 'original',
      };

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .set(getAuthHeader())
        .send(createNoteDto)
        .expect(201);

      createdNoteId = response.body._id;

      const otherUserToken = generateToken(testUser2Id);
      const otherUserNote = {
        title: 'Other user note',
        content: 'Other user content',
      };

      const otherResponse = await request(app.getHttpServer())
        .post('/api/notes')
        .set({ Authorization: `Bearer ${otherUserToken}` })
        .send(otherUserNote)
        .expect(201);

      otherUserNoteId = otherResponse.body._id;
    });

    it('should update a note successfully with valid payload', async () => {
      const updateNoteDto = {
        title: 'Updated Note Title',
        content: 'Updated content',
        tags: ['updated'],
        category: 'updated',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/notes/${createdNoteId}`)
        .set(getAuthHeader())
        .send(updateNoteDto)
        .expect(200);

      expect(response.body.title).toBe(updateNoteDto.title);
      expect(response.body.content).toBe(updateNoteDto.content);
      expect(response.body.tags).toEqual(updateNoteDto.tags);
      expect(response.body.category).toBe(updateNoteDto.category);
      expect(response.body._id).toBe(createdNoteId);
      expect(response.body.user).toBe(testUserId);
    });

    it('should update only provided fields (partial update)', async () => {
      // First, get the current note state
      const getResponse = await request(app.getHttpServer())
        .get(`/api/notes/${createdNoteId}`)
        .set(getAuthHeader())
        .expect(200);

      const originalTitle = getResponse.body.title;

      // Update only the content
      const updateNoteDto = {
        content: 'Partially updated content',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/notes/${createdNoteId}`)
        .set(getAuthHeader())
        .send(updateNoteDto)
        .expect(200);

      expect(response.body.content).toBe(updateNoteDto.content);
      expect(response.body.title).toBe(originalTitle);
    });

    it('should return 400 when invalid data types are provided', async () => {
      const updateNoteDto = {
        title: 123, // Should be string
        content: true, // Should be string
      };

      const response = await request(app.getHttpServer())
        .put(`/api/notes/${createdNoteId}`)
        .set(getAuthHeader())
        .send(updateNoteDto)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 404 when note does not exist', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      const updateNoteDto = {
        title: 'Updated title',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/notes/${nonExistentId}`)
        .set(getAuthHeader())
        .send(updateNoteDto)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 when note ID format is invalid', async () => {
      const invalidId = 'invalid-object-id';
      const updateNoteDto = {
        title: 'Updated title',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/notes/${invalidId}`)
        .set(getAuthHeader())
        .send(updateNoteDto)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 404 when note belongs to different user', async () => {
      const updateNoteDto = {
        title: 'Attempted update',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/notes/${otherUserNoteId}`)
        .set(getAuthHeader())
        .send(updateNoteDto)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 401 when no authentication token is provided', async () => {
      const updateNoteDto = {
        title: 'Updated title',
      };

      await request(app.getHttpServer())
        .put(`/api/notes/${createdNoteId}`)
        .send(updateNoteDto)
        .expect(401);
    });
  });

  describe('DELETE /api/notes/:noteId', () => {
    let createdNoteId: string;
    let otherUserNoteId: string;

    beforeEach(async () => {
      const createNoteDto = {
        title: 'Note for DELETE test',
        content: 'Content to be deleted',
      };

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .set(getAuthHeader())
        .send(createNoteDto)
        .expect(201);

      createdNoteId = response.body._id;

      const otherUserToken = generateToken(testUser2Id);
      const otherUserNote = {
        title: 'Other user note',
        content: 'Other user content',
      };

      const otherResponse = await request(app.getHttpServer())
        .post('/api/notes')
        .set({ Authorization: `Bearer ${otherUserToken}` })
        .send(otherUserNote)
        .expect(201);

      otherUserNoteId = otherResponse.body._id;
    });

    it('should delete a note successfully', async () => {
      await request(app.getHttpServer())
        .delete(`/api/notes/${createdNoteId}`)
        .set(getAuthHeader())
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/notes/${createdNoteId}`)
        .set(getAuthHeader())
        .expect(404);
    });

    it('should return 404 when note does not exist', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      const response = await request(app.getHttpServer())
        .delete(`/api/notes/${nonExistentId}`)
        .set(getAuthHeader())
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 when note ID format is invalid', async () => {
      const invalidId = 'invalid-object-id';

      const response = await request(app.getHttpServer())
        .delete(`/api/notes/${invalidId}`)
        .set(getAuthHeader())
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 404 when note belongs to different user', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/notes/${otherUserNoteId}`)
        .set(getAuthHeader())
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 401 when no authentication token is provided', async () => {
      await request(app.getHttpServer())
        .delete(`/api/notes/${createdNoteId}`)
        .expect(401);
    });
  });
});
