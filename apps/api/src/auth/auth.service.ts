import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import type { Response } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./jwt-auth.guard";
import { CSRF_COOKIE } from "./csrf.guard";
import { randomBytes } from "crypto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  private async issueTokens(userId: string, tokenVersion: number) {
    const access = await this.jwt.signAsync(
      { sub: userId, tokenVersion },
      { secret: process.env.JWT_ACCESS_SECRET ?? "dev-access", expiresIn: "15m" },
    );
    const refresh = await this.jwt.signAsync(
      { sub: userId, tokenVersion },
      { secret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh", expiresIn: "7d" },
    );
    return { access, refresh };
  }

  setAuthCookies(res: Response, access: string, refresh: string) {
    const secure = process.env.NODE_ENV === "production";
    const common = { httpOnly: true, secure, sameSite: "strict" as const, path: "/" };
    res.cookie(ACCESS_COOKIE, access, { ...common, maxAge: 15 * 60 * 1000 });
    res.cookie(REFRESH_COOKIE, refresh, { ...common, maxAge: 7 * 24 * 60 * 60 * 1000 });
    // CSRF token is readable by JS so the SPA can echo it in a header.
    res.cookie(CSRF_COOKIE, randomBytes(24).toString("hex"), {
      httpOnly: false,
      secure,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  clearAuthCookies(res: Response) {
    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE]) {
      res.clearCookie(name, { path: "/" });
    }
  }

  async login(email: string, password: string, totp: string | undefined, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    // Generic message to avoid user enumeration.
    if (!user || !user.isActive) throw new UnauthorizedException("Invalid credentials");

    const valid = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!totp) throw new UnauthorizedException("2FA code required");
      const ok = authenticator.verify({ token: totp, secret: user.twoFactorSecret });
      if (!ok) throw new UnauthorizedException("Invalid 2FA code");
    }

    const { access, refresh } = await this.issueTokens(user.id, user.tokenVersion);
    this.setAuthCookies(res, access, refresh);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { id: user.id, email: user.email, name: user.name, role: user.role.name };
  }

  async refresh(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) throw new UnauthorizedException("No refresh token");
    let payload: { sub: string; tokenVersion: number };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh",
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException("Session expired");
    }
    const { access, refresh } = await this.issueTokens(user.id, user.tokenVersion);
    this.setAuthCookies(res, access, refresh);
    return { ok: true };
  }

  async changePassword(userId: string, current: string, next: string, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const valid = await argon2.verify(user.passwordHash, current).catch(() => false);
    if (!valid) throw new BadRequestException("Current password is incorrect");

    const passwordHash = await this.hashPassword(next);
    // Bump tokenVersion to invalidate all existing sessions.
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
    const { access, refresh } = await this.issueTokens(updated.id, updated.tokenVersion);
    this.setAuthCookies(res, access, refresh);
    return { ok: true };
  }

  async begin2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
    const otpauth = authenticator.keyuri(user.email, "ForgeCMS", secret);
    const qr = await QRCode.toDataURL(otpauth);
    return { secret, qr };
  }

  async enable2FA(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) throw new BadRequestException("Start 2FA setup first");
    const ok = authenticator.verify({ token, secret: user.twoFactorSecret });
    if (!ok) throw new BadRequestException("Invalid code");
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    return { ok: true };
  }

  async disable2FA(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }
}
