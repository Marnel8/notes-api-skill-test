import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Note } from './schemas/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(@InjectModel(Note.name) private noteModel: Model<Note>) {}

  async create(createNoteDto: CreateNoteDto, userId: string): Promise<Note> {
    const note = new this.noteModel({
      ...createNoteDto,
      user: new Types.ObjectId(userId),
    });
    return note.save();
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
    category?: string,
    tag?: string,
  ) {
    const skip = (page - 1) * limit;

    const filter: any = { user: new Types.ObjectId(userId) };

    if (category) {
      filter.category = category;
    }

    if (tag) {
      filter.tags = tag;
    }

    const [notes, total] = await Promise.all([
      this.noteModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.noteModel.countDocuments(filter),
    ]);

    return {
      notes,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string): Promise<Note> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid note ID');
    }

    const note = await this.noteModel
      .findOne({
        _id: new Types.ObjectId(id),
        user: new Types.ObjectId(userId),
      })
      .exec();

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  async update(
    id: string,
    updateNoteDto: UpdateNoteDto,
    userId: string,
  ): Promise<Note> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid note ID');
    }

    const note = await this.noteModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), user: new Types.ObjectId(userId) },
        updateNoteDto,
        { new: true },
      )
      .exec();

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  async remove(id: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid note ID');
    }

    const result = await this.noteModel
      .deleteOne({
        _id: new Types.ObjectId(id),
        user: new Types.ObjectId(userId),
      })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Note not found');
    }
  }
}
