import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserRole } from './schemas/user.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async createUser(userData: {
    email: string;
    name: string;
    picture: string;
    googleId: string;
  }): Promise<User> {
    const user = new this.userModel(userData);

    return user.save();
  }

  async findOrCreate(googleUser: any): Promise<User> {
    let user = await this.findByEmail(googleUser.email);

    if (!user) {
      user = await this.createUser({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        googleId: googleUser.id,
      });
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      user.id,
      {
        name: googleUser.name,
        picture: googleUser.picture,
        googleId: googleUser.id,
      },
      {
        new: true,
      },
    );

    if (!updatedUser) {
      throw new NotFoundException('User could not be updated');
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  // ADMIN ONLY METHODS

  async getAllUsers(): Promise<User[]> {
    return this.userModel
      .find()
      .select('-googleId') // Exclude sensitive fields
      .sort({ createdAt: -1 })
      .exec();
  }

  async getUserById(userId: string): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel
      .findById(userId)
      .select('-googleId')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async makeAdmin(userId: string): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, { role: 'admin' }, { new: true })
      .select('-googleId')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async makeRegularUser(userId: string): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, { role: 'user' }, { new: true })
      .select('-googleId')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    if (!['user', 'admin'].includes(role)) {
      throw new BadRequestException('Invalid role. Must be "user" or "admin"');
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, { role }, { new: true })
      .select('-googleId')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deleteUser(
    userId: string,
  ): Promise<{ message: string; deletedUser: any }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admin from deleting themselves
    // This would be checked at controller level with request user

    await this.userModel.findByIdAndDelete(userId).exec();

    return {
      message: 'User deleted successfully',
      deletedUser: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
