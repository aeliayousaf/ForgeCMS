import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { emptyPageDocument, type PageDocument } from "@forgecms/shared";
import { sanitizeDocument } from "../common/sanitize";

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.page.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        isHomepage: true,
        updatedAt: true,
        publishedAt: true,
      },
    });
  }

  async get(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!page) throw new NotFoundException("Page not found");
    const latest = page.versions[0];
    return {
      ...page,
      document: (latest?.document as unknown as PageDocument) ?? emptyPageDocument(),
    };
  }

  async create(input: { title: string; slug: string; document?: PageDocument }, authorId?: string) {
    const doc = sanitizeDocument(input.document ?? emptyPageDocument());
    return this.prisma.page.create({
      data: {
        title: input.title,
        slug: input.slug,
        status: "draft",
        versions: { create: { version: 1, document: doc as object, authorId } },
      },
    });
  }

  // Saves a new draft version with the supplied document.
  async saveDraft(id: string, document: PageDocument, meta: Partial<{ title: string; slug: string; seoTitle: string; seoDescription: string; ogImage: string }>, authorId?: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!page) throw new NotFoundException("Page not found");
    const nextVersion = (page.versions[0]?.version ?? 0) + 1;
    const clean = sanitizeDocument(document);

    await this.prisma.pageVersion.create({
      data: { pageId: id, version: nextVersion, document: clean as object, authorId },
    });
    return this.prisma.page.update({
      where: { id },
      data: {
        title: meta.title ?? page.title,
        slug: meta.slug ?? page.slug,
        seoTitle: meta.seoTitle ?? page.seoTitle,
        seoDescription: meta.seoDescription ?? page.seoDescription,
        ogImage: meta.ogImage ?? page.ogImage,
      },
    });
  }

  async publish(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!page) throw new NotFoundException("Page not found");
    const latest = page.versions[0];
    if (!latest) throw new NotFoundException("No version to publish");

    await this.prisma.pageVersion.updateMany({ where: { pageId: id }, data: { isPublished: false } });
    await this.prisma.pageVersion.update({ where: { id: latest.id }, data: { isPublished: true } });
    return this.prisma.page.update({
      where: { id },
      data: {
        status: "published",
        publishedDoc: latest.document as object,
        publishedAt: new Date(),
      },
    });
  }

  async unpublish(id: string) {
    return this.prisma.page.update({
      where: { id },
      data: { status: "draft", publishedDoc: undefined, publishedAt: null },
    });
  }

  async duplicate(id: string) {
    const page = await this.get(id);
    let slug = `${page.slug}-copy`;
    let n = 1;
    while (await this.prisma.page.findUnique({ where: { slug } })) {
      slug = `${page.slug}-copy-${n++}`;
    }
    return this.create({ title: `${page.title} (Copy)`, slug, document: page.document });
  }

  async remove(id: string) {
    await this.prisma.page.delete({ where: { id } });
    return { ok: true };
  }

  versions(id: string) {
    return this.prisma.pageVersion.findMany({
      where: { pageId: id },
      orderBy: { version: "desc" },
      select: { id: true, version: true, isPublished: true, createdAt: true },
    });
  }
}
