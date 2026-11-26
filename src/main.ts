import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }))

  // Libera o consumo da API pelo front-end, que roda em outra porta (ex.: 5173)
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
