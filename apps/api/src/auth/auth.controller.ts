import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { Public, CurrentUser, type AuthUser } from "../common/decorators";
import { loginSchema, passwordSchema } from "@forgecms/shared";
import { parse } from "../common/zod";
import { z } from "zod";
import { REFRESH_COOKIE } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("login")
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const dto = parse(loginSchema, body);
    return this.auth.login(dto.email, dto.password, dto.totp, res);
  }

  @Public()
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.refresh(req.cookies?.[REFRESH_COOKIE], res);
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    this.auth.clearAuthCookies(res);
    return { ok: true };
  }

  @Get("me")
  async me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Post("change-password")
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const dto = parse(
      z.object({ current: z.string().min(1), next: passwordSchema }),
      body,
    );
    return this.auth.changePassword(user.id, dto.current, dto.next, res);
  }

  @Post("2fa/begin")
  async begin2fa(@CurrentUser() user: AuthUser) {
    return this.auth.begin2FA(user.id);
  }

  @Post("2fa/enable")
  async enable2fa(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const dto = parse(z.object({ token: z.string().min(6) }), body);
    return this.auth.enable2FA(user.id, dto.token);
  }

  @Post("2fa/disable")
  async disable2fa(@CurrentUser() user: AuthUser) {
    return this.auth.disable2FA(user.id);
  }
}
