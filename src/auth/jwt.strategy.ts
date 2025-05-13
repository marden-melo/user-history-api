import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UsersService } from '../user/users.service';
import { User, UserRole } from '../user/users.entity';
import { UnauthorizedException } from '@shared/errors/exceptions/unauthorized.exception';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? '',
    });
  }

  async validate(
    payload: JwtPayload,
  ): Promise<Pick<User, 'id' | 'email' | 'role'>> {
    console.log('JwtStrategy - Payload:', payload);
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      console.log('JwtStrategy - Usuário não encontrado:', payload.sub);
      throw new UnauthorizedException('Invalid token');
    }
    console.log('JwtStrategy - Usuário:', {
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    };
  }
}
