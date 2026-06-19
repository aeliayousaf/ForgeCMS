import { Module } from "@nestjs/common";
import { AiService } from "./ai.service";
import { AiController } from "./ai.controller";
import { MenusModule } from "../menus/menus.module";
import { PagesModule } from "../pages/pages.module";
import { ThemesModule } from "../themes/themes.module";

@Module({
  imports: [MenusModule, PagesModule, ThemesModule],
  providers: [AiService],
  controllers: [AiController],
})
export class AiModule {}
