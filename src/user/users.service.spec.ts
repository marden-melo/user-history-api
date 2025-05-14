import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CreateUserDto, UserResponseDto } from './dto/userDTO';
import * as bcrypt from 'bcrypt';
import { UserRole } from './users.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User)) as jest.Mocked<
      Repository<User>
    >;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um novo usuário com sucesso', async () => {
      const dto: CreateUserDto = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'Senha@123',
        role: UserRole.USER,
      };

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const createdUser: User = {
        ...dto,
        id: 'uuid',
        password: hashedPassword,
        refreshTokenHash: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(createdUser);
      repository.save.mockResolvedValue(createdUser);

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        password: expect.any(String),
      });
      expect(repository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result).toMatchObject({
        id: 'uuid',
        name: 'João Silva',
        email: 'joao@example.com',
        role: UserRole.USER,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('deve lançar exceção se o email já estiver em uso', async () => {
      const dto: CreateUserDto = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'Senha@123',
        role: UserRole.USER,
      };

      const existingUser: User = {
        id: 'uuid',
        name: dto.name,
        email: dto.email,
        password: dto.password,
        role: dto.role,
        refreshTokenHash: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findOne.mockResolvedValue(existingUser);

      await expect(service.create(dto)).rejects.toThrowError(
        new BadRequestException('E-mail já está em uso'),
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
    });
  });
});
