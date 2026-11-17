import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger as PinoNestLogger, PinoLogger } from 'nestjs-pino';
import pino from 'pino';
import { AppModule } from './app.module';
import { loadAppConfig } from './config/app.config';
import { HttpExceptionLoggingFilter } from './logging/http-exception-logging.filter';
import {
  buildPinoOptions,
  createBootstrapLogger,
  createFastifyAdapter,
} from './logging/pino-config';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

function logCriticalAndExit(event: string, reason: unknown): void {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  const root =
    PinoLogger.root ??
    pino({ ...buildPinoOptions(), transport: undefined });
  root.fatal({ logger: 'Bootstrap', err }, event);
  root.flush(() => process.exit(1));
  setTimeout(() => process.exit(1), 500).unref();
}

process.on('unhandledRejection', (reason) => {
  logCriticalAndExit('Unhandled promise rejection', reason);
});

process.on('uncaughtException', (error) => {
  logCriticalAndExit('Uncaught exception', error);
});

async function bootstrap() {
  const logger = createBootstrapLogger();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    createFastifyAdapter(),
    { logger },
  );

  app.useLogger(app.get(PinoNestLogger));
  app.useGlobalFilters(new HttpExceptionLoggingFilter(app.getHttpAdapter()));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const { port } = loadAppConfig();
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`Core API running on: http://localhost:${port}`);
}
bootstrap();
