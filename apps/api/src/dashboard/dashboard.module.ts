import { Controller, Get, Injectable, Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser, type AuthUser } from "../common/decorators";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [pages, publishedPages, posts, media, users, themes] = await Promise.all([
      this.prisma.page.count(),
      this.prisma.page.count({ where: { status: "published" } }),
      this.prisma.post.count(),
      this.prisma.mediaFile.count(),
      this.prisma.user.count(),
      this.prisma.theme.count(),
    ]);
    const recentPages = await this.prisma.page.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, slug: true, status: true, updatedAt: true },
    });
    return { pages, publishedPages, posts, media, users, themes, recentPages };
  }
}

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("stats")
  stats(@CurrentUser() _user: AuthUser) {
    return this.dashboard.stats();
  }
}

@Module({
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
