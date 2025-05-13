import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { User, UserRole } from '../../user/users.entity';

export type Subjects = 'User' | 'all';
export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: Pick<User, 'id' | 'role'>) {
    console.log('CaslAbilityFactory - Usuário:', user);
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    if (user.role === UserRole.ADMIN) {
      can('manage', 'all');
    } else if (user.role === UserRole.MANAGER) {
      can('read', 'User');
      can('update', 'User', ['name', 'email', 'password']);
      cannot('update', 'User', ['role']).because(
        'Gerentes não podem alterar permissões',
      );
      cannot('create', 'User').because('Gerentes não podem criar usuários');
      cannot('delete', 'User').because('Gerentes não podem excluir usuários');
    } else {
      can('read', 'User', { id: user.id });
      can('update', 'User', ['name', 'email', 'password'], { id: user.id });
      cannot('create', 'User').because(
        'Usuários comuns não podem criar usuários',
      );
      cannot('read', 'User', { id: { $ne: user.id } }).because(
        'Usuários comuns só podem visualizar seu próprio perfil',
      );
      cannot('update', 'User', { id: { $ne: user.id } }).because(
        'Usuários comuns só podem editar seu próprio perfil',
      );
      cannot('update', 'User', ['role']).because(
        'Usuários comuns não podem alterar permissões',
      );
      cannot('delete', 'User').because(
        'Usuários comuns não podem excluir usuários',
      );
      cannot('read', 'User').because(
        'Usuários comuns não podem listar todos os usuários',
      );
    }

    const ability = build();
    console.log('CaslAbilityFactory - Habilidades:', ability.rules);
    return ability;
  }
}
