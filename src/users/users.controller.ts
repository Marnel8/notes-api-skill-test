import {
  Controller,
  Get,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { UserRole } from './schemas/user.schema';

@Controller('/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ADMIN ONLY ENDPOINTS

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(':userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getUserById(@Param('userId') userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Put(':userId/make-admin')
  @UseGuards(RolesGuard)
  // @Roles(UserRole.ADMIN)
  makeAdmin(@Param('userId') userId: string) {
    return this.usersService.makeAdmin(userId);
  }

  @Put(':userId/make-regular')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  makeRegularUser(@Param('userId') userId: string) {
    return this.usersService.makeRegularUser(userId);
  }

  @Delete(':userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  deleteUser(@Param('userId') userId: string, @Request() req) {
    // Prevent admin from deleting themselves
    if (userId === req.user.sub) {
      throw new BadRequestException('You cannot delete your own account');
    }

    return this.usersService.deleteUser(userId);
  }
}
