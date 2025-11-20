import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

@Schema({ timestamps: true })
export class Note extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: User;

  // Bonus: Tags and categorization
  @Prop([String])
  tags: string[];

  @Prop({ default: 'general' })
  category: string;
}

export const NoteSchema = SchemaFactory.createForClass(Note);
