import { Module } from '@nestjs/common';
import { CaslAbilityFactory } from './abilities/casl-ability.factory';

@Module({
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
})
export class SharedModule {}
