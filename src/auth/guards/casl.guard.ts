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

    console.log('Usuário no CaslGuard:', user);

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }
    if (!user.role) {
      console.log('CaslGuard - Role indefinido para usuário:', user);
      throw new ForbiddenException('Role do usuário não definido');
    }

    const ability = this.caslAbilityFactory.createForUser(user);
    const action =
      this.reflector.get<string>('action', context.getHandler()) ||
      context.getHandler().name;
    const subject =
      this.reflector.get<string>('subject', context.getHandler()) || 'User';

    console.log('Verificando permissão:', {
      action,
      subject,
      userRole: user.role,
      userId: user.id,
    });

    // Read single user
    if (action === 'read' && subject === 'User' && request.params.id) {
      const targetUser = await this.usersService.findById(request.params.id);
      if (!targetUser) {
        throw new NotFoundException('User not found');
      }
      const canRead = ability.can(action, { ...targetUser, __entity: 'User' });
      console.log('Permissão para leitura de usuário:', {
        canRead,
        targetUserId: targetUser.id,
      });
      return canRead;
    }

    // Update user
    if (action === 'update' && subject === 'User' && request.params.id) {
      const targetUser = await this.usersService.findById(request.params.id);
      if (!targetUser) {
        throw new NotFoundException('User not found');
      }
      const updateData: UpdateUserDto = request.body;

      // Check permission for each field
      for (const field of Object.keys(updateData) as (keyof UpdateUserDto)[]) {
        // Check field-level permission
        const canUpdateField = ability.can('update', subject, field);
        // For regular users, restrict to their own profile
        const canUpdate =
          user.role === 'user'
            ? canUpdateField && user.id === targetUser.id
            : canUpdateField;
        console.log(`Verificando campo '${field}':`, {
          canUpdate,
          canUpdateField,
          targetUserId: targetUser.id,
          userId: user.id,
          userRole: user.role,
        });
        if (!canUpdate) {
          console.log(`Permissão negada para o campo '${field}'`);
          throw new ForbiddenException(
            `Ação 'update' no campo '${field}' de '${subject}' não permitida`,
          );
        }
      }
      return true;
    }

    // List users
    if (action === 'read' && subject === 'User' && !request.params.id) {
      const canRead = ability.can(action, subject);
      console.log('Permissão para listagem:', { userRole: user.role, canRead });
      if (!canRead) {
        throw new ForbiddenException("Ação 'read' em 'User' não permitida");
      }
      return true;
    }

    // Create or delete
    const canPerform = ability.can(action, subject);
    console.log('Permissão concedida:', { action, subject, canPerform });
    if (canPerform) {
      return true;
    }

    throw new ForbiddenException(
      `Ação '${action}' em '${subject}' não permitida`,
    );
  }
}
