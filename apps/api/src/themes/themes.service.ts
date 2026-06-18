import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { activateTheme } from "@forgecms/database";

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.theme.findMany({ orderBy: { name: "asc" } });
  }

  async active() {
    const theme = await this.prisma.theme.findFirst({ where: { isActive: true } });
    return theme ?? this.prisma.theme.findUnique({ where: { key: "business" } });
  }

  async activate(key: string) {
    const exists = await this.prisma.theme.findUnique({ where: { key } });
    if (!exists) throw new NotFoundException("Theme not found");
    // Switching themes does not touch page content, only the active style set.
    return activateTheme(this.prisma, key);
  }
}
