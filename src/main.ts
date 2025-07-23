import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseProvider } from './db';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Connect to the database before starting the server
  const dbProvider = app.get(DatabaseProvider);
  try {
    await dbProvider.connect();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
