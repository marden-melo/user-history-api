import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../user/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '@shared/email/mail.service';
import { User } from '../user/users.entity';
import { UserRole } from '../user/users.entity';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserResponseDto } from '../user/dto/userDTO';
import { plainToClass } from 'class-transformer';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            findByResetToken: jest.fn(),
            findByRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    mailService = module.get(MailService) as jest.Mocked<MailService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('forgotPassword', () => {
    it('deve enviar um e-mail de redefinição de senha para um usuário existente', async () => {
      const user: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const resetToken = uuidv4();
      const expires = new Date(Date.now() + 30 * 60 * 1000);

      usersService.findByEmail.mockResolvedValue(user);
      usersService.update.mockResolvedValue(
        plainToClass(UserResponseDto, user),
      );
      mailService.sendPasswordResetEmail.mockResolvedValue();

      await service.forgotPassword('joao@example.com');

      expect(usersService.findByEmail).toHaveBeenCalledWith('joao@example.com');
      expect(usersService.update).toHaveBeenCalledWith(user.id, {
        resetPasswordToken: expect.any(String),
        resetPasswordExpires: expect.any(Date),
      });
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'joao@example.com',
        expect.any(String),
      );
    });

    it('deve ignorar silenciosamente se o e-mail não existir', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword('naoexiste@example.com'),
      ).resolves.toBeUndefined();
      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'naoexiste@example.com',
      );
      expect(usersService.update).not.toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('deve lançar erro se o envio de e-mail falhar', async () => {
      const user: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByEmail.mockResolvedValue(user);
      usersService.update.mockResolvedValue(
        plainToClass(UserResponseDto, user),
      );
      mailService.sendPasswordResetEmail.mockRejectedValue(
        new Error('Erro no servidor de e-mail'),
      );

      await expect(
        service.forgotPassword('joao@example.com'),
      ).rejects.toThrowError(
        'Falha ao enviar e-mail de redefinição: Erro no servidor de e-mail',
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith('joao@example.com');
      expect(usersService.update).toHaveBeenCalledWith(user.id, {
        resetPasswordToken: expect.any(String),
        resetPasswordExpires: expect.any(Date),
      });
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'joao@example.com',
        expect.any(String),
      );
    });
  });

  describe('resetPassword', () => {
    it('deve redefinir a senha com um token válido', async () => {
      const user: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: await bcrypt.hash('reset-token', 10),
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByResetToken.mockResolvedValue(user);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      usersService.update.mockResolvedValue(
        plainToClass(UserResponseDto, user),
      );

      await service.resetPassword('reset-token', 'NovaSenha@123');

      expect(usersService.findByResetToken).toHaveBeenCalledWith('reset-token');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'reset-token',
        user.resetPasswordToken,
      );
      expect(usersService.update).toHaveBeenCalledWith(user.id, {
        password: expect.any(String),
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
    });

    it('deve lançar exceção se o token for inválido', async () => {
      usersService.findByResetToken.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'NovaSenha@123'),
      ).rejects.toThrowError(
        new BadRequestException('Token de redefinição inválido ou expirado'),
      );
      expect(usersService.findByResetToken).toHaveBeenCalledWith(
        'invalid-token',
      );
      expect(usersService.update).not.toHaveBeenCalled();
    });

    it('deve lançar exceção se o token estiver expirado', async () => {
      const user: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: await bcrypt.hash('reset-token', 10),
        resetPasswordExpires: new Date(Date.now() - 10 * 60 * 1000), // Expirado
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByResetToken.mockResolvedValue(user);

      await expect(
        service.resetPassword('reset-token', 'NovaSenha@123'),
      ).rejects.toThrowError(
        new BadRequestException('Token de redefinição expirado'),
      );
      expect(usersService.findByResetToken).toHaveBeenCalledWith('reset-token');
      expect(usersService.update).not.toHaveBeenCalled();
    });

    it('deve lançar exceção se o token não corresponder', async () => {
      const user: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: await bcrypt.hash('other-token', 10),
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByResetToken.mockResolvedValue(user);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(
        service.resetPassword('reset-token', 'NovaSenha@123'),
      ).rejects.toThrowError(
        new BadRequestException('Token de redefinição inválido'),
      );
      expect(usersService.findByResetToken).toHaveBeenCalledWith('reset-token');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'reset-token',
        user.resetPasswordToken,
      );
      expect(usersService.update).not.toHaveBeenCalled();
    });
  });

  describe('validateResetToken', () => {
    it('deve validar um token de redefinição válido', async () => {
      const user: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: await bcrypt.hash('reset-token', 10),
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByResetToken.mockResolvedValue(user);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      await expect(
        service.validateResetToken('reset-token'),
      ).resolves.toBeUndefined();
      expect(usersService.findByResetToken).toHaveBeenCalledWith('reset-token');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'reset-token',
        user.resetPasswordToken,
      );
    });

    it('deve lançar exceção se o token for inválido', async () => {
      usersService.findByResetToken.mockResolvedValue(null);

      await expect(
        service.validateResetToken('invalid-token'),
      ).rejects.toThrowError(
        new BadRequestException('Token de redefinição inválido ou expirado'),
      );
      expect(usersService.findByResetToken).toHaveBeenCalledWith(
        'invalid-token',
      );
    });

    it('deve lançar exceção se o token estiver expirado', async () => {
      const user: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: await bcrypt.hash('reset-token', 10),
        resetPasswordExpires: new Date(Date.now() - 10 * 60 * 1000), // Expirado
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByResetToken.mockResolvedValue(user);

      await expect(
        service.validateResetToken('reset-token'),
      ).rejects.toThrowError(
        new BadRequestException('Token de redefinição expirado'),
      );
      expect(usersService.findByResetToken).toHaveBeenCalledWith('reset-token');
    });

    it('deve lançar exceção se o token não corresponder', async () => {
      const user: User = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        password: 'hashed',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: await bcrypt.hash('other-token', 10),
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByResetToken.mockResolvedValue(user);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(
        service.validateResetToken('reset-token'),
      ).rejects.toThrowError(
        new BadRequestException('Token de redefinição inválido'),
      );
      expect(usersService.findByResetToken).toHaveBeenCalledWith('reset-token');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'reset-token',
        user.resetPasswordToken,
      );
    });
  });
});
