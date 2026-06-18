import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  private async siteContext() {
    const [site, theme, menu] = await Promise.all([
      this.settings.getPublic(),
      this.prisma.theme.findFirst({ where: { isActive: true } }),
      this.prisma.menu.findUnique({
        where: { location: "primary" },
        include: { items: { orderBy: { order: "asc" } } },
      }),
    ]);
    return {
      site,
      theme: theme ?? (await this.prisma.theme.findFirst()),
      menu: menu?.items.map((i) => ({ label: i.label, url: i.url })) ?? [],
    };
  }

  async getPage(slug: string) {
    const page = await this.prisma.page.findFirst({
      where: { slug, status: "published" },
    });
    if (!page || !page.publishedDoc) throw new NotFoundException("Page not found");
    const ctx = await this.siteContext();
    return {
      page: {
        title: page.title,
        slug: page.slug,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        ogImage: page.ogImage,
        document: page.publishedDoc,
      },
      ...ctx,
    };
  }

  async getHome() {
    const page = await this.prisma.page.findFirst({
      where: { isHomepage: true, status: "published" },
    });
    if (page) return this.getPage(page.slug);
    // Fallback to a page with slug "home".
    return this.getPage("home");
  }

  async listPosts() {
    return this.prisma.post.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      select: { title: true, slug: true, excerpt: true, coverImage: true, publishedAt: true },
    });
  }

  async getPost(slug: string) {
    const post = await this.prisma.post.findFirst({ where: { slug, status: "published" } });
    if (!post) throw new NotFoundException("Post not found");
    const ctx = await this.siteContext();
    return { post, ...ctx };
  }

  async sitemap() {
    const [pages, posts] = await Promise.all([
      this.prisma.page.findMany({
        where: { status: "published" },
        select: { slug: true, isHomepage: true, updatedAt: true },
      }),
      this.prisma.post.findMany({
        where: { status: "published" },
        select: { slug: true, updatedAt: true },
      }),
    ]);
    const urls = [
      ...pages.map((p) => ({ loc: p.isHomepage ? "/" : `/${p.slug}`, lastmod: p.updatedAt })),
      ...posts.map((p) => ({ loc: `/blog/${p.slug}`, lastmod: p.updatedAt })),
    ];
    return urls;
  }
}
