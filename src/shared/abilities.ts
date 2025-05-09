import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { User, UserRole } from 'user/users.entity';

export function defineAbilitiesFor(user: Pick<User, 'id' | 'role'>) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (user.role === UserRole.ADMIN) {
    can('manage', 'all'); // Admin pode tudo
  } else if (user.role === UserRole.MANAGER) {
    can('read', 'User'); // Gerente pode visualizar todos
    can('update', 'User', ['name', 'email', 'password']); // Edita campos limitados
    cannot('update', 'User', ['role']); // Não altera role
    cannot('delete', 'User'); // Não exclui
    cannot('create', 'User'); // Não cria
  } else if (user.role === UserRole.USER || user.role === UserRole.TESTER) {
    can('read', 'User', { id: user.id }); // Só visualiza próprio perfil
    can('update', 'User', ['name', 'email', 'password'], { id: user.id }); // Só edita próprio perfil
    cannot('create', 'User'); // Não cria
    cannot('delete', 'User'); // Não exclui
  }

  return build();
}
