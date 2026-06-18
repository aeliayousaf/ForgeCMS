import { Body, Controller, Get, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { SetupService } from "./setup.service";
import { Public } from "../common/decorators";
import { setupCompleteSchema } from "@forgecms/shared";
import { parse } from "../common/zod";

// The entire setup flow is public because no users exist yet. Each mutating
// endpoint re-checks install state to prevent re-running after completion.
@Public()
@Controller("setup")
export class SetupController {
  constructor(private readonly setup: SetupService) {}

  @Get("status")
  status() {
    return this.setup.status();
  }

  @Post("test-db")
  testDb() {
    return this.setup.testDb();
  }

  @Get("themes")
  themes() {
    return this.setup.listThemes();
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("complete")
  complete(@Body() body: unknown) {
    const dto = parse(setupCompleteSchema, body);
    return this.setup.complete(dto);
  }
}
