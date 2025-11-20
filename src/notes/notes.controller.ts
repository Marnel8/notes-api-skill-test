import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Controller('notes')
@UseGuards(AuthGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class NotesController {
  constructor(private readonly noteService: NotesService) {}

  @Post()
  create(@Body() createNoteDto: CreateNoteDto, @Request() req) {
    return this.noteService.create(createNoteDto, req.user.sub);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
  ) {
    return this.noteService.findAll(req.user.sub, page, limit, category, tag);
  }

  @Get(':noteId')
  findOne(@Param('noteId') id: string, @Request() req) {
    return this.noteService.findOne(id, req.user.sub);
  }

  @Put(':noteId')
  update(
    @Param('noteId') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @Request() req,
  ) {
    return this.noteService.update(id, updateNoteDto, req.user.sub);
  }

  @Delete(':noteId')
  remove(@Param('noteId') id: string, @Request() req) {
    return this.noteService.remove(id, req.user.sub);
  }
}
