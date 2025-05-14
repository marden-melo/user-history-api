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
    if (!user.role) {
      throw new ForbiddenException('Role do usuário não definido');
    }

    const ability = this.caslAbilityFactory.createForUser(user);
    const action =
      this.reflector.get<string>('action', context.getHandler()) ||
      context.getHandler().name;
    const subject =
      this.reflector.get<string>('subject', context.getHandler()) || 'User';

    if (action === 'read' && subject === 'User' && request.params.id) {
      const targetUser = await this.usersService.findById(request.params.id);
      if (!targetUser) {
        throw new NotFoundException('User not found');
      }
      const canRead = ability.can(action, { ...targetUser, __entity: 'User' });

      return canRead;
    }

    if (action === 'update' && subject === 'User' && request.params.id) {
      const targetUser = await this.usersService.findById(request.params.id);
      if (!targetUser) {
        throw new NotFoundException('User not found');
      }
      const updateData: UpdateUserDto = request.body;

      for (const field of Object.keys(updateData) as (keyof UpdateUserDto)[]) {
        const canUpdateField = ability.can('update', subject, field);
        const canUpdate =
          user.role === 'user'
            ? canUpdateField && user.id === targetUser.id
            : canUpdateField;

        if (!canUpdate) {
          console.log(`Permissão negada para o campo '${field}'`);
          throw new ForbiddenException(
            `Ação 'update' no campo '${field}' de '${subject}' não permitida`,
          );
        }
      }
      return true;
    }

    if (action === 'read' && subject === 'User' && !request.params.id) {
      const canRead = ability.can(action, subject);
      if (!canRead) {
        throw new ForbiddenException("Ação 'read' em 'User' não permitida");
      }
      return true;
    }

    const canPerform = ability.can(action, subject);
    if (canPerform) {
      return true;
    }

    throw new ForbiddenException(
      `Ação '${action}' em '${subject}' não permitida`,
    );
  }
}
