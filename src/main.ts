import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@shared/errors/error.filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SeedService } from '@shared/seeds/seed.service';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const seedService = app.get(SeedService);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Configuração Swagger
  const config = new DocumentBuilder()
    .setTitle('API UserHistory')
    .setDescription('Documentação automática das rotas')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const shouldSeed = configService.get<boolean>('SEED_DATABASE', false);
  if (shouldSeed) {
    console.log('Running database seed...');
    await seedService.runSeeds();
    console.log('Database seed completed.');
  }

  await app.listen(configService.get<number>('PORT', 3333));
}
bootstrap();
