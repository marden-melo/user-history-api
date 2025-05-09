import { Module } from '@nestjs/common';
import { CaslGuard } from './cast-guard';

@Module({
  providers: [CaslGuard],
  exports: [CaslGuard],
})
export class SharedModule {}
