import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Permissions } from "../common/decorators";
import { PermissionsGuard } from "../auth/permissions.guard";
import { PERMISSIONS, blockNodeSchema } from "@forgecms/shared";
import { parse } from "../common/zod";
import { z } from "zod";

@Injectable()
export class ComponentsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.component.findMany({ orderBy: { updatedAt: "desc" } });
  }

  create(input: { name: string; blocks: unknown; isGlobal?: boolean }) {
    return this.prisma.component.create({
      data: { name: input.name, blocks: input.blocks as object, isGlobal: input.isGlobal ?? false },
    });
  }

  async remove(id: string) {
    await this.prisma.component.delete({ where: { id } });
    return { ok: true };
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  blocks: z.array(blockNodeSchema),
  isGlobal: z.boolean().optional(),
});

@Controller("components")
@UseGuards(PermissionsGuard)
export class ComponentsController {
  constructor(private readonly components: ComponentsService) {}

  @Permissions(PERMISSIONS.COMPONENT_MANAGE)
  @Get()
  list() {
    return this.components.list();
  }

  @Permissions(PERMISSIONS.COMPONENT_MANAGE)
  @Post()
  create(@Body() body: unknown) {
    const dto = parse(createSchema, body);
    return this.components.create(dto);
  }

  @Permissions(PERMISSIONS.COMPONENT_MANAGE)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.components.remove(id);
  }
}

@Module({
  providers: [ComponentsService],
  controllers: [ComponentsController],
})
export class ComponentsModule {}
