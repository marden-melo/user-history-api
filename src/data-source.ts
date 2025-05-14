import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'userhistory',
  password: process.env.DB_PASSWORD ?? 'userhistory@2025',
  database: process.env.DB_NAME ?? 'userhistory_api',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/@migrations/*.js'],
  migrationsRun: false,
});
