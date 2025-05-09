import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/userDTO';
import { User } from './users.entity';
import { CaslGuard } from '@shared/cast-guard';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @UseGuards(CaslGuard)
  @SetMetadata('action', 'create')
  @SetMetadata('subject', 'User')
  async create(@Body() userData: CreateUserDto): Promise<User> {
    return this.usersService.create(userData);
  }

  @Get()
  @UseGuards(CaslGuard)
  @SetMetadata('action', 'read')
  @SetMetadata('subject', 'User')
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(CaslGuard)
  @SetMetadata('action', 'read')
  @SetMetadata('subject', 'User')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @UseGuards(CaslGuard)
  @SetMetadata('action', 'update')
  @SetMetadata('subject', 'User')
  @SetMetadata('fields', ['name', 'email', 'password', 'role'])
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(CaslGuard)
  @SetMetadata('action', 'delete')
  @SetMetadata('subject', 'User')
  async delete(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);
  }
}
