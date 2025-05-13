import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { plainToClass } from 'class-transformer';
import { User } from './users.entity';
import { CreateUserDto, UserResponseDto } from './dto/userDTO';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new BadRequestException('E-mail já está em uso');
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
    });
    const savedUser = await this.usersRepository.save(user);
    return plainToClass(UserResponseDto, savedUser, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find();
    return plainToClass(UserResponseDto, users, {
      excludeExtraneousValues: true,
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findByIdDto(id: string): Promise<UserResponseDto> {
    const user = await this.findById(id);
    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    const users = await this.usersRepository.find();
    for (const user of users) {
      if (
        user.refreshTokenHash &&
        (await bcrypt.compare(refreshToken, user.refreshTokenHash))
      ) {
        return user;
      }
    }
    return null;
  }

  async findByResetToken(token: string): Promise<User | null> {
    const users = await this.usersRepository.find({
      where: {
        resetPasswordToken: Not(IsNull()),
        resetPasswordExpires: MoreThan(new Date()),
      },
    });
    for (const user of users) {
      if (
        user.resetPasswordToken &&
        (await bcrypt.compare(token, user.resetPasswordToken))
      ) {
        return user;
      }
    }
    return null;
  }

  async update(
    id: string,
    updateData: Partial<User>,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('E-mail já está em uso');
      }
    }

    await this.usersRepository.update(id, updateData);
    const updatedUser = await this.usersRepository.findOne({ where: { id } });
    if (!updatedUser) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return plainToClass(UserResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.usersRepository.delete(id);
  }
}
