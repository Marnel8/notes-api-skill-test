import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { getModelToken } from '@nestjs/mongoose';
import { Note } from './schemas/note.schema';

describe('NotesService', () => {
  let service: NotesService;
  const noteModelMock = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: getModelToken(Note.name), useValue: noteModelMock },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
