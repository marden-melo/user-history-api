import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { plainToClass } from 'class-transformer';
import { UsersService } from '../user/users.service';
import { User } from '../user/users.entity';
import { UserResponseDto } from '../user/dto/userDTO';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from '@shared/email/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: UserResponseDto;
  }> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refresh_token = await this.generateRefreshToken(user);
    const userResponse = plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
    return {
      access_token,
      refresh_token,
      user: userResponse,
    };
  }

  async generateRefreshToken(user: User): Promise<string> {
    const refreshToken = uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(user.id, { refreshTokenHash });
    return refreshToken;
  }

  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const user = await this.usersService.findByRefreshToken(refreshToken);
    if (!user) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    const new_refresh_token = await this.generateRefreshToken(user);
    return {
      access_token,
      refresh_token: new_refresh_token,
    };
  }

  async invalidateRefreshToken(userId: string): Promise<void> {
    this.logger.log(`Invalidando refresh token para usuário ID: ${userId}`);
    await this.usersService.update(userId, { refreshTokenHash: null });
    this.logger.log(
      `Refresh token invalidado com sucesso para usuário ID: ${userId}`,
    );
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.log(`Nenhum usuário encontrado para o e-mail: ${email}`);
      return;
    }
    const resetToken = uuidv4();
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const expires = new Date(Date.now() + 30 * 60 * 1000);

    await this.usersService.update(user.id, {
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: expires,
    });
    try {
      await this.mailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      throw new Error(
        `Falha ao enviar e-mail de redefinição: ${error.message}`,
      );
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByResetToken(token);
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      throw new BadRequestException(
        'Token de redefinição inválido ou expirado',
      );
    }

    if (user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Token de redefinição expirado');
    }

    const isValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isValid) {
      throw new BadRequestException('Token de redefinição inválido');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(user.id, {
      password: passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  async validateResetToken(token: string): Promise<void> {
    const user = await this.usersService.findByResetToken(token);
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      throw new BadRequestException(
        'Token de redefinição inválido ou expirado',
      );
    }

    if (user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Token de redefinição expirado');
    }

    const isValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isValid) {
      throw new BadRequestException('Token de redefinição inválido');
    }
  }
}
