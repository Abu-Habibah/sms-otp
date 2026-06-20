import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  // Security headers
  app.use(helmet());

  const cookieParser = (await import('cookie-parser')).default;
  app.use(cookieParser());

  // CORS for the web admin
  const corsOrigins = config.get<string>('CORS_ORIGINS')?.split(',') ?? [];
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });

  // Zod-backed request validation (via class-validator + zod in DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // OpenAPI — only mount in non-production
  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SMS Monitor v2.0 API')
      .setDescription('Multi-tenant SMS forwarding SaaS')
      .setVersion('0.1.6')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = Number(config.get<string>('PORT') ?? 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on :${port} (env=${config.get<string>('NODE_ENV') ?? 'development'})`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[backend] fatal startup error', err);
  process.exit(1);
});
