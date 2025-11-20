import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { AuthGuard } from '../auth/auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('NotesController', () => {
  let controller: NotesController;

  const notesServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const authGuardMock = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const jwtServiceMock = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        { provide: NotesService, useValue: notesServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(authGuardMock)
      .compile();

    controller = module.get<NotesController>(NotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
