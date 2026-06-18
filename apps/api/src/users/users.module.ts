import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  Param,
  Post,
  Put,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "../auth/auth.service";
import { Permissions, CurrentUser, type AuthUser } from "../common/decorators";
import { PermissionsGuard } from "../auth/permissions.guard";
import { PERMISSIONS, passwordSchema } from "@forgecms/shared";
import { parse } from "../common/zod";
import { z } from "zod";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        role: { select: { name: true } },
      },
    });
  }

  roles() {
    return this.prisma.role.findMany({ select: { id: true, name: true, description: true } });
  }

  async create(input: { name: string; email: string; password: string; roleName: string }) {
    const role = await this.prisma.role.findUnique({ where: { name: input.roleName } });
    if (!role) throw new BadRequestException("Invalid role");
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new BadRequestException("Email already in use");
    const passwordHash = await this.auth.hashPassword(input.password);
    return this.prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash, roleId: role.id },
      select: { id: true, email: true, name: true },
    });
  }

  async update(id: string, input: { name?: string; roleName?: string; isActive?: boolean }) {
    const data: Record<string, unknown> = {};
    if (input.name) data.name = input.name;
    if (typeof input.isActive === "boolean") data.isActive = input.isActive;
    if (input.roleName) {
      const role = await this.prisma.role.findUnique({ where: { name: input.roleName } });
      if (!role) throw new BadRequestException("Invalid role");
      data.roleId = role.id;
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true },
    });
  }

  async remove(id: string, actingUserId: string) {
    if (id === actingUserId) throw new ForbiddenException("You cannot delete yourself");
    const admins = await this.prisma.user.count({ where: { role: { name: "admin" } } });
    const target = await this.prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (target?.role.name === "admin" && admins <= 1) {
      throw new ForbiddenException("Cannot delete the last admin");
    }
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }
}

@Controller("users")
@UseGuards(PermissionsGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Permissions(PERMISSIONS.USER_MANAGE)
  @Get()
  list() {
    return this.users.list();
  }

  @Permissions(PERMISSIONS.USER_MANAGE)
  @Get("roles")
  roles() {
    return this.users.roles();
  }

  @Permissions(PERMISSIONS.USER_MANAGE)
  @Post()
  create(@Body() body: unknown) {
    const dto = parse(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: passwordSchema,
        roleName: z.string().min(1),
      }),
      body,
    );
    return this.users.create(dto);
  }

  @Permissions(PERMISSIONS.USER_MANAGE)
  @Put(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    const dto = parse(
      z.object({
        name: z.string().min(1).optional(),
        roleName: z.string().min(1).optional(),
        isActive: z.boolean().optional(),
      }),
      body,
    );
    return this.users.update(id, dto);
  }

  @Permissions(PERMISSIONS.USER_MANAGE)
  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.users.remove(id, user.id);
  }
}

@Module({
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
