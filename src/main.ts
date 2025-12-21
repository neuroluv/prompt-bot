import { SystemLoggerService } from '@config';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(new SystemLoggerService());
  const configService = app.get(ConfigService);

  const systemLogger = new SystemLoggerService();
  systemLogger.setContext('Main');

  app.setGlobalPrefix('api');
  app.useGlobalInterceptors();
  app.enableCors({
    credentials: true,
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  });

  const PORT = configService.get('PORT') || 3002;

  await app.listen(PORT, () => {
    systemLogger.startApp(PORT, process.env.NODE_ENV);
  });
}
bootstrap();
