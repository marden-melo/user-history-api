import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@shared/errors/error.filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SeedService } from '@shared/seeds/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const seedService = app.get(SeedService);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors();

  const shouldSeed = configService.get<boolean>('SEED_DATABASE', false);
  if (shouldSeed) {
    console.log('Running database seed...');
    await seedService.runSeeds();
    console.log('Database seed completed.');
  }

  await app.listen(configService.get<number>('PORT', 3000));
}
bootstrap();
