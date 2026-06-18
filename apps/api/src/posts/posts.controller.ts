import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { Permissions, CurrentUser, type AuthUser } from "../common/decorators";
import { PermissionsGuard } from "../auth/permissions.guard";
import { PERMISSIONS, createPostSchema } from "@forgecms/shared";
import { parse } from "../common/zod";
import { z } from "zod";

@Controller("posts")
@UseGuards(PermissionsGuard)
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Permissions(PERMISSIONS.POST_READ)
  @Get()
  list() {
    return this.posts.list();
  }

  @Permissions(PERMISSIONS.POST_READ)
  @Get(":id")
  get(@Param("id") id: string) {
    return this.posts.get(id);
  }

  @Permissions(PERMISSIONS.POST_WRITE)
  @Post()
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = parse(createPostSchema, body);
    return this.posts.create(dto, user.id);
  }

  @Permissions(PERMISSIONS.POST_WRITE)
  @Put(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    const dto = parse(createPostSchema.partial().extend({ coverImage: z.string().optional(), seoTitle: z.string().optional(), seoDescription: z.string().optional() }), body);
    return this.posts.update(id, dto);
  }

  @Permissions(PERMISSIONS.POST_WRITE)
  @Post(":id/publish")
  publish(@Param("id") id: string) {
    return this.posts.publish(id);
  }

  @Permissions(PERMISSIONS.POST_WRITE)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.posts.remove(id);
  }
}
