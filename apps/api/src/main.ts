import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: true });

  app.setGlobalPrefix("api");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Same-origin behind nginx in production; allow web origin in dev.
  app.enableCors({
    origin: process.env.APP_URL?.split(",") ?? true,
    credentials: true,
  });

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`ForgeCMS API listening on :${port}`);
}

void bootstrap();
