import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DatabaseProvider } from './db';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with all origins allowed
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Apply global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false, // Allow unknown properties
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Apply global logging interceptor
  const loggingInterceptor = app.get(LoggingInterceptor);
  app.useGlobalInterceptors(loggingInterceptor);

  // Connect to MongoDB before starting the server
  const dbProvider = app.get(DatabaseProvider);
  try {
    await dbProvider.connect();

  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  }

  // Start the server on all interfaces (0.0.0.0)
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

}
bootstrap();
