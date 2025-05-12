import {
  Controller,
  Post,
  Body,
  HttpCode,
  Request,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserResponseDto } from '../user/dto/userDTO';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import { LoginDto } from './dto/loginDTO';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@email.com' })
  email: string;
}

class ResetPasswordDto {
  @ApiProperty({ example: 'reset_token_here' })
  token: string;
  @ApiProperty({ example: 'NewPassword123!' })
  password: string;
}

interface AuthenticatedRequest extends ExpressRequest {
  user?: { id: string; email: string; role: string };
  body: { refresh_token: string };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autenticar usuário e gerar token JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Usuário autenticado com sucesso',
    schema: {
      example: {
        access_token: 'jwt.token.aqui',
        refresh_token: 'refresh.token.aqui',
        user: {
          id: 'uuid',
          name: 'Nome do usuário',
          email: 'email@exemplo.com',
          role: 'admin',
        },
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: UserResponseDto;
  }> {
    this.logger.log(`Requisição de login recebida para: ${loginDto.email}`);
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: { type: 'string', example: 'refresh.token.aqui' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados com sucesso',
    schema: {
      example: {
        access_token: 'new.jwt.token.aqui',
        refresh_token: 'new.refresh.token.aqui',
      },
    },
  })
  async refresh(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ access_token: string; refresh_token: string }> {
    this.logger.log(
      `Requisição de renovação de token para usuário ID: ${req.user?.id}`,
    );
    const userId = req.user!.id;
    const refreshToken = req.body.refresh_token;
    return this.authService.refreshToken(userId, refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 204,
    description: 'E-mail de redefinição enviado (se e-mail existir)',
  })
  async forgotPassword(@Body('email') email: string): Promise<void> {
    this.logger.log(
      `Recebida requisição de redefinição de senha para: ${email}`,
    );
    try {
      await this.authService.forgotPassword(email);
      this.logger.log(`Processo de redefinição concluído para: ${email}`);
    } catch (error) {
      this.logger.error(
        `Erro ao processar redefinição de senha para ${email}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('reset-password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Redefinir senha usando token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 204, description: 'Senha redefinida com sucesso' })
  async resetPassword(@Body() body: ResetPasswordDto): Promise<void> {
    this.logger.log(`Recebida requisição de redefinição de senha com token`);
    await this.authService.resetPassword(body.token, body.password);
    this.logger.log(`Senha redefinida com sucesso`);
  }
}
