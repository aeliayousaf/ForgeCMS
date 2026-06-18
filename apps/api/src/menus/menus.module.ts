import { Body, Controller, Get, Module, Param, Put, UseGuards } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Public, Permissions } from "../common/decorators";
import { PermissionsGuard } from "../auth/permissions.guard";
import { PERMISSIONS } from "@forgecms/shared";
import { parse } from "../common/zod";
import { z } from "zod";

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async byLocation(location: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { location },
      include: { items: { orderBy: { order: "asc" } } },
    });
    return menu ?? { name: location, location, items: [] };
  }

  list() {
    return this.prisma.menu.findMany({ include: { items: { orderBy: { order: "asc" } } } });
  }

  async replaceItems(location: string, items: { label: string; url: string }[]) {
    const menu = await this.prisma.menu.upsert({
      where: { location },
      update: {},
      create: { name: location, location },
    });
    await this.prisma.menuItem.deleteMany({ where: { menuId: menu.id } });
    await this.prisma.menuItem.createMany({
      data: items.map((it, i) => ({ menuId: menu.id, label: it.label, url: it.url, order: i })),
    });
    return this.byLocation(location);
  }
}

const itemsSchema = z.object({
  items: z.array(z.object({ label: z.string().min(1), url: z.string().min(1) })),
});

@Controller("menus")
@UseGuards(PermissionsGuard)
export class MenusController {
  constructor(private readonly menus: MenusService) {}

  @Public()
  @Get("location/:location")
  byLocation(@Param("location") location: string) {
    return this.menus.byLocation(location);
  }

  @Permissions(PERMISSIONS.MENU_MANAGE)
  @Get()
  list() {
    return this.menus.list();
  }

  @Permissions(PERMISSIONS.MENU_MANAGE)
  @Put(":location")
  replace(@Param("location") location: string, @Body() body: unknown) {
    const dto = parse(itemsSchema, body);
    return this.menus.replaceItems(location, dto.items);
  }
}

@Module({
  providers: [MenusService],
  controllers: [MenusController],
  exports: [MenusService],
})
export class MenusModule {}
