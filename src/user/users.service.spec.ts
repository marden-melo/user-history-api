import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
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
      };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(createdUser);
      repository.save.mockResolvedValue(createdUser);

      const result = await service.create(dto);

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
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshTokenHash');
      expect(result).not.toHaveProperty('resetPasswordToken');
      expect(result).not.toHaveProperty('resetPasswordExpires');
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
      };

      repository.findOne.mockResolvedValue(existingUser);

      await expect(service.create(dto)).rejects.toThrowError(
        new BadRequestException('Email already in use'),
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
    });
  });

  describe('findAll', () => {
    it('deve retornar uma lista de usuários', async () => {
      const users: User[] = [
        {
          id: '1',
          name: 'João',
          email: 'joao@example.com',
          password: 'hashed',
          role: UserRole.USER,
          refreshTokenHash: null,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
        {
          id: '2',
          name: 'Maria',
          email: 'maria@example.com',
          password: 'hashed',
          role: UserRole.ADMIN,
          refreshTokenHash: null,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      ];

      repository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserResponseDto);
      expect(result[1]).toBeInstanceOf(UserResponseDto);
      expect(result).toMatchObject([
        {
          id: '1',
          name: 'João',
          email: 'joao@example.com',
          role: UserRole.USER,
        },
        {
          id: '2',
          name: 'Maria',
          email: 'maria@example.com',
          role: UserRole.ADMIN,
        },
      ]);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0]).not.toHaveProperty('refreshTokenHash');
      expect(result[0]).not.toHaveProperty('resetPasswordToken');
      expect(result[0]).not.toHaveProperty('resetPasswordExpires');
    });
  });

  describe('findById', () => {
    it('deve retornar um usuário pelo ID', async () => {
      const user: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      };

      repository.findOne.mockResolvedValue(user);

      const result = await service.findById('1');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result).toMatchObject({
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        role: UserRole.USER,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshTokenHash');
      expect(result).not.toHaveProperty('resetPasswordToken');
      expect(result).not.toHaveProperty('resetPasswordExpires');
    });

    it('deve lançar exceção se o usuário não for encontrado', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrowError(
        new NotFoundException('User not found'),
      );
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('findByEmail', () => {
    it('deve retornar um usuário pelo email', async () => {
      const user: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      };

      repository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('joao@example.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'joao@example.com' },
      });
      expect(result).toEqual(user);
    });

    it('deve retornar null se o usuário não for encontrado', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('joao@example.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'joao@example.com' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByResetToken', () => {
    it('deve retornar um usuário com token de redefinição válido', async () => {
      const user: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: await bcrypt.hash('reset-token', 10),
        resetPasswordExpires: null,
      };

      repository.find.mockResolvedValue([user]);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const result = await service.findByResetToken('reset-token');

      expect(repository.find).toHaveBeenCalledWith();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'reset-token',
        user.resetPasswordToken,
      );
      expect(result).toEqual(user);
    });

    it('deve retornar null se o token não corresponder', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findByResetToken('invalid-token');

      expect(repository.find).toHaveBeenCalledWith();
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('deve atualizar um usuário com sucesso', async () => {
      const existingUser: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      };
      const updateData = {
        name: 'João Silva',
        email: 'joao.silva@example.com',
      };
      const updatedUser: User = { ...existingUser, ...updateData };

      repository.findOne
        .mockResolvedValueOnce(existingUser) // Verifica existência
        .mockResolvedValueOnce(null) // Verifica email único
        .mockResolvedValueOnce(updatedUser); // Após update
      repository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.update('1', updateData);

      expect(repository.findOne).toHaveBeenCalledTimes(3);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'joao.silva@example.com' },
      });
      expect(repository.update).toHaveBeenCalledWith('1', updateData);
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result).toMatchObject({
        id: '1',
        name: 'João Silva',
        email: 'joao.silva@example.com',
        role: UserRole.USER,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshTokenHash');
      expect(result).not.toHaveProperty('resetPasswordToken');
      expect(result).not.toHaveProperty('resetPasswordExpires');
    });

    it('deve atualizar a senha corretamente', async () => {
      const existingUser: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      };
      const updateData = { password: 'NovaSenha@123' };
      const updatedUser: User = {
        ...existingUser,
        password: await bcrypt.hash('NovaSenha@123', 10),
      };

      repository.findOne
        .mockResolvedValueOnce(existingUser) // Verifica existência
        .mockResolvedValueOnce(updatedUser); // Após update
      repository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.update('1', updateData);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(repository.update).toHaveBeenCalledWith('1', {
        password: expect.any(String),
      });
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result).toMatchObject({
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        role: UserRole.USER,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshTokenHash');
    });

    it('deve lançar exceção se o email já estiver em uso por outro usuário', async () => {
      const existingUser: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      };
      const otherUser: User = {
        id: '2',
        name: 'Maria',
        email: 'maria@example.com',
        password: 'hashed',
        role: UserRole.ADMIN,
        refreshTokenHash: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      };

      repository.findOne
        .mockResolvedValueOnce(existingUser) // Verifica existência
        .mockResolvedValueOnce(otherUser); // Email já em uso

      await expect(
        service.update('1', { email: 'maria@example.com' }),
      ).rejects.toThrowError(new BadRequestException('Email already in use'));
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'maria@example.com' },
      });
    });

    it('deve lançar exceção se o usuário não for encontrado', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('1', { name: 'João Silva' }),
      ).rejects.toThrowError(new NotFoundException('User not found'));
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('delete', () => {
    it('deve deletar um usuário com sucesso', async () => {
      const user: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      };

      repository.findOne.mockResolvedValue(user);
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      await expect(service.delete('1')).resolves.toBeUndefined();
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(repository.delete).toHaveBeenCalledWith('1');
    });

    it('deve lançar exceção se o usuário não for encontrado', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.delete('1')).rejects.toThrowError(
        new NotFoundException('User not found'),
      );
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
