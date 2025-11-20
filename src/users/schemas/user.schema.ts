import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  picture: string;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role: UserRole;

  @Prop({ required: true })
  googleId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
