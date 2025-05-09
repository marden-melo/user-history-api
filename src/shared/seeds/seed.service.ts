import { Injectable } from '@nestjs/common';
import { UsersService } from '../../user/users.service';
import { seedTestUser } from './user.seed';

@Injectable()
export class SeedService {
  constructor(private usersService: UsersService) {}

  async runSeeds(): Promise<void> {
    await seedTestUser(this.usersService);
  }
}
