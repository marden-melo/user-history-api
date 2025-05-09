import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '@shared/abilities/casl-ability.factory';
import { ForbiddenException } from '@shared/errors/exceptions/forbidden.exception';
import { NotFoundException } from '@shared/errors/exceptions/not-found.exception';
import { UsersService } from '../../user/users.service';
import { Request } from 'express';
import { User } from '../../user/users.entity';
import { UpdateUserDto } from '../../user/dto/userDTO';

interface AuthenticatedRequest extends Request {
  user?: Pick<User, 'id' | 'email' | 'role'>;
  body: UpdateUserDto;
}

@Injectable()
export class CaslGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const ability = this.caslAbilityFactory.createForUser(user);
    const action =
      this.reflector.get<string>('action', context.getHandler()) ||
      context.getHandler().name;
    const subject =
      this.reflector.get<string>('subject', context.getHandler()) || 'User';
    const fields = this.reflector.get<string[]>('fields', context.getHandler());

    // Validação para GET /users/:id
    if (action === 'read' && subject === 'User' && request.params.id) {
      const targetUser = await this.usersService.findById(request.params.id);
      if (!targetUser) {
        throw new NotFoundException('User not found');
      }
      return ability.can(action, { ...targetUser, __entity: 'User' });
    }

    // Validação para PATCH /users/:id
    if (action === 'update' && subject === 'User' && request.params.id) {
      const targetUser = await this.usersService.findById(request.params.id);
      if (!targetUser) {
        throw new NotFoundException('User not found');
      }
      const updateData: UpdateUserDto = request.body;
      for (const field of Object.keys(updateData) as (keyof UpdateUserDto)[]) {
        if (fields && !fields.includes(field)) {
          throw new ForbiddenException(
            `Ação 'update' no campo '${field}' de '${subject}' não permitida`,
          );
        }
        if (!ability.can(action, { ...targetUser, __entity: 'User' }, field)) {
          throw new ForbiddenException(
            `Ação 'update' no campo '${field}' de '${subject}' não permitida`,
          );
        }
      }
      return true;
    }

    // Validação para GET /users (listagem)
    if (action === 'read' && subject === 'User' && !request.params.id) {
      return ability.can(action, subject);
    }

    // Validação para POST /users e DELETE /users/:id
    if (ability.can(action, subject)) {
      return true;
    }

    throw new ForbiddenException(
      `Ação '${action}' em '${subject}' não permitida`,
    );
  }
}
