import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { defineAbilitiesFor } from '@shared/abilities';
import { ForbiddenException } from '@shared/errors/exceptions/forbidden.exception';
import { Request } from 'express';
import { User } from 'user/users.entity';

interface AuthenticatedRequest extends Request {
  user?: Pick<User, 'id' | 'email' | 'role'>;
}

@Injectable()
export class CaslGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Usuário não autenticado');

    const ability = defineAbilitiesFor(user);

    const action = this.reflector.get<string>('action', context.getHandler());
    const subject = this.reflector.get<string>('subject', context.getHandler());
    const fields = this.reflector.get<string[]>('fields', context.getHandler());

    if (!action || !subject) return true;

    if (fields && fields.length > 0) {
      fields.forEach((field) => {
        if (!ability.can(action, subject, field)) {
          throw new ForbiddenException(
            `Ação '${action}' no campo '${field}' de '${subject}' não permitida`,
          );
        }
      });
    } else {
      if (!ability.can(action, subject)) {
        throw new ForbiddenException(
          `Ação '${action}' em '${subject}' não permitida`,
        );
      }
    }

    return true;
  }
}
