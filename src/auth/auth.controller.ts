import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserResponseDto } from '../user/dto/userDTO';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoginDto } from './dto/loginDTO';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
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
  ): Promise<{ access_token: string; user: UserResponseDto }> {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
