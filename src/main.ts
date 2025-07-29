import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseProvider } from './db';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with all origins allowed
  app.enableCors({
    origin: true, // Allow all origins
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  
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
