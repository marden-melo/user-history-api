import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../user/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../shared/email/mail.service';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { User } from '../user/users.entity';
import { UserResponseDto } from '../user/dto/userDTO';
import { UserRole } from '../user/users.entity';
import { plainToClass } from 'class-transformer';

jest.mock('bcrypt');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

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
            findByRefreshToken: jest.fn(),
            findByResetToken: jest.fn(),
            update: jest.fn(),
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

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-value');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const user: User = {
        id: 'uuid',
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'hashed-password',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'joao@example.com',
        'Senha@123',
      );

      expect(result).toEqual(user);
      expect(usersService.findByEmail).toHaveBeenCalledWith('joao@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('Senha@123', user.password);
    });

    it('should return null if credentials are invalid', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'joao@example.com',
        'Senha@123',
      );

      expect(result).toBeNull();
      expect(usersService.findByEmail).toHaveBeenCalledWith('joao@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return tokens and user data for valid credentials', async () => {
      const user: User = {
        id: 'uuid',
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'hashed-password',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const userResponse = plainToClass(UserResponseDto, user, {
        excludeExtraneousValues: true,
      });

      usersService.findByEmail.mockResolvedValue(user);
      jwtService.sign.mockReturnValue('access-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');
      usersService.update.mockResolvedValue(userResponse);

      const result = await service.login('joao@example.com', 'Senha@123');

      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: 'mocked-uuid',
        user: expect.objectContaining({
          id: 'uuid',
          name: 'João Silva',
          email: 'joao@example.com',
          role: UserRole.USER,
        }),
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith('joao@example.com');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: user.id, email: user.email, role: user.role },
        { expiresIn: '15m' },
      );
      expect(usersService.update).toHaveBeenCalledWith(user.id, {
        refreshTokenHash: 'hashed-refresh-token',
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('joao@example.com', 'Senha@123'),
      ).rejects.toThrowError(
        new UnauthorizedException('Credenciais inválidas'),
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      const user: User = {
        id: 'uuid',
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'hashed-password',
        role: UserRole.USER,
        refreshTokenHash: 'hashed-refresh-token',
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByRefreshToken.mockResolvedValue(user);
      jwtService.sign.mockReturnValue('new-access-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-refresh-token');

      const result = await service.refreshToken('refresh-token');

      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'mocked-uuid',
      });
      expect(usersService.findByRefreshToken).toHaveBeenCalledWith(
        'refresh-token',
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: user.id, email: user.email, role: user.role },
        { expiresIn: '15m' },
      );
      expect(usersService.update).toHaveBeenCalledWith(user.id, {
        refreshTokenHash: 'new-hashed-refresh-token',
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      usersService.findByRefreshToken.mockResolvedValue(null);

      await expect(service.refreshToken('invalid-token')).rejects.toThrowError(
        new UnauthorizedException('Refresh token inválido'),
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email for valid email', async () => {
      const user: User = {
        id: 'uuid',
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'hashed-password',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByEmail.mockResolvedValue(user);
      mailService.sendPasswordResetEmail.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-reset-token');

      await service.forgotPassword('joao@example.com');

      expect(usersService.findByEmail).toHaveBeenCalledWith('joao@example.com');
      expect(usersService.update).toHaveBeenCalledWith(user.id, {
        resetPasswordToken: 'hashed-reset-token',
        resetPasswordExpires: expect.any(Date),
      });
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'joao@example.com',
        'mocked-uuid',
      );
    });

    it('should not throw error for non-existent email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword('nonexistent@example.com'),
      ).resolves.toBeUndefined();
      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
      expect(usersService.update).not.toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const user: User = {
        id: 'uuid',
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'hashed-password',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: 'hashed-reset-token',
        resetPasswordExpires: new Date(Date.now() + 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByResetToken.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await service.resetPassword('reset-token', 'NewPassword@123');

      expect(usersService.findByResetToken).toHaveBeenCalledWith('reset-token');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'reset-token',
        user.resetPasswordToken,
      );
      expect(usersService.update).toHaveBeenCalledWith(user.id, {
        password: 'new-hashed-password',
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
    });

    it('should throw BadRequestException for invalid token', async () => {
      usersService.findByResetToken.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'NewPassword@123'),
      ).rejects.toThrowError(
        new BadRequestException('Token de redefinição inválido ou expirado'),
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      const user: User = {
        id: 'uuid',
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'hashed-password',
        role: UserRole.USER,
        refreshTokenHash: null,
        resetPasswordToken: 'hashed-reset-token',
        resetPasswordExpires: new Date(Date.now() - 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByResetToken.mockResolvedValue(user);

      await expect(
        service.resetPassword('reset-token', 'NewPassword@123'),
      ).rejects.toThrowError(
        new BadRequestException('Token de redefinição expirado'),
      );
    });
  });
});
