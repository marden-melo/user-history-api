import {
  Controller,
  Post,
  Body,
  HttpCode,
  Request,
  UseGuards,
  Logger,
  Res,
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
import { Request as ExpressRequest, Response } from 'express';
import { UnauthorizedException } from '@shared/errors/exceptions/unauthorized.exception';

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
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: UserResponseDto;
  }> {
    this.logger.log(`Requisição de login recebida para: ${loginDto.email}`);
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return result;
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
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
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não fornecido');
    }
    this.logger.log(`Requisição de renovação de token com refresh_token`);
    const result = await this.authService.refreshToken(refreshToken);
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout e invalidar refresh token' })
  @ApiResponse({ status: 204, description: 'Logout realizado com sucesso' })
  @HttpCode(204)
  async logout(
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    this.logger.log(`Logout requisitado para usuário ID: ${req.user?.id}`);
    const userId = req.user!.id;
    await this.authService.invalidateRefreshToken(userId);
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
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
    try {
      await this.authService.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  }

  @Post('reset-password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Redefinir senha usando token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 204, description: 'Senha redefinida com sucesso' })
  async resetPassword(@Body() body: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(body.token, body.password);
  }
}
