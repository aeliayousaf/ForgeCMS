import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { SettingsModule } from "./settings/settings.module";
import { AuditModule } from "./audit/audit.module";
import { MediaModule } from "./media/media.module";
import { SetupModule } from "./setup/setup.module";
import { PagesModule } from "./pages/pages.module";
import { PostsModule } from "./posts/posts.module";
import { ThemesModule } from "./themes/themes.module";
import { MenusModule } from "./menus/menus.module";
import { ComponentsModule } from "./components/components.module";
import { UsersModule } from "./users/users.module";
import { AiModule } from "./ai/ai.module";
import { BackupsModule } from "./backups/backups.module";
import { PublicModule } from "./public/public.module";
import { FormsModule } from "./forms/forms.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { ReactBitsModule } from "./integrations/react-bits/react-bits.module";

import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { CsrfGuard } from "./auth/csrf.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    SettingsModule,
    AuditModule,
    MediaModule,
    SetupModule,
    PagesModule,
    PostsModule,
    ThemesModule,
    MenusModule,
    ComponentsModule,
    UsersModule,
    AiModule,
    BackupsModule,
    PublicModule,
    FormsModule,
    DashboardModule,
    ReactBitsModule,
  ],
  providers: [
    // Order matters: throttle, then authenticate, then CSRF-check.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule {}
