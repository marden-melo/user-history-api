import { UsersService } from '../../user/users.service';
import { UserRole } from '../../user/users.entity';

export async function seedTestUser(usersService: UsersService): Promise<void> {
  const testUser = {
    email: 'admin@example.com',
    password: 'Test123!',
    name: 'Admin',
    role: UserRole.ADMIN,
  };

  const existingUser = await usersService.findByEmail(testUser.email);
  if (!existingUser) {
    await usersService.create(testUser);
    console.log('Test user created:', testUser.email);
  } else {
    console.log('Test user already exists:', testUser.email);
  }
}
