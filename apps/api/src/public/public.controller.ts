import { Controller, Get, Param } from "@nestjs/common";
import { PublicService } from "./public.service";
import { Public } from "../common/decorators";

@Public()
@Controller("public")
export class PublicController {
  constructor(private readonly content: PublicService) {}

  @Get("home")
  home() {
    return this.content.getHome();
  }

  @Get("page/:slug")
  page(@Param("slug") slug: string) {
    return this.content.getPage(slug);
  }

  @Get("posts")
  posts() {
    return this.content.listPosts();
  }

  @Get("post/:slug")
  post(@Param("slug") slug: string) {
    return this.content.getPost(slug);
  }

  @Get("sitemap")
  sitemap() {
    return this.content.sitemap();
  }
}
