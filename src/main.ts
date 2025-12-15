import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomLogger } from './common/logger/custom-logger.service';
import { SeedService } from './database/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLogger(),
  });
  
  const logger = app.get(CustomLogger);
  logger.log('Application starting…', 'Bootstrap', {
    port: process.env.PORT ?? 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  });

  // Run database seeding
  const seedService = app.get(SeedService);
  await seedService.seedProviders();

  await app.listen(process.env.PORT ?? 3000);
  
  logger.log('Application started successfully', 'Bootstrap', {
    url: await app.getUrl(),
  });
}
bootstrap();
