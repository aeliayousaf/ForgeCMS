import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { emptyPageDocument, type PageDocument } from "@forgecms/shared";
import { sanitizeDocument } from "../common/sanitize";

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.post.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, slug: true, status: true, updatedAt: true, publishedAt: true },
    });
  }

  async get(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException("Post not found");
    return post;
  }

  create(input: { title: string; slug: string; excerpt?: string; document?: PageDocument }, authorId?: string) {
    return this.prisma.post.create({
      data: {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        document: sanitizeDocument(input.document ?? emptyPageDocument()) as object,
        authorId,
      },
    });
  }

  async update(id: string, input: Partial<{ title: string; slug: string; excerpt: string; document: PageDocument; coverImage: string; seoTitle: string; seoDescription: string }>) {
    return this.prisma.post.update({
      where: { id },
      data: {
        ...input,
        document: input.document ? (sanitizeDocument(input.document) as object) : undefined,
      },
    });
  }

  publish(id: string) {
    return this.prisma.post.update({
      where: { id },
      data: { status: "published", publishedAt: new Date() },
    });
  }

  async remove(id: string) {
    await this.prisma.post.delete({ where: { id } });
    return { ok: true };
  }
}
