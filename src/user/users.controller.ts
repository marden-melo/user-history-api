import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  SetMetadata,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/userDTO';
import { CaslGuard } from '@auth/guards/casl.guard';
import { NotFoundException } from '@shared/errors/exceptions/not-found.exception';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(CaslGuard)
  @SetMetadata('action', 'create')
  @SetMetadata('subject', 'User')
  async create(@Body() userData: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(userData);
  }

  @Get()
  @UseGuards(CaslGuard)
  @SetMetadata('action', 'read')
  @SetMetadata('subject', 'User')
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(CaslGuard)
  @SetMetadata('action', 'read')
  @SetMetadata('subject', 'User')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Patch(':id')
  @UseGuards(CaslGuard)
  @SetMetadata('action', 'update')
  @SetMetadata('subject', 'User')
  @SetMetadata('fields', ['name', 'email', 'password', 'role'])
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, updateData);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Delete(':id')
  @UseGuards(CaslGuard)
  @SetMetadata('action', 'delete')
  @SetMetadata('subject', 'User')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersService.delete(id);
  }
}
