import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { IS_PUBLIC_KEY } from "../common/decorators";
import { ROLE_PERMISSIONS, type RoleName } from "@forgecms/shared";

export const ACCESS_COOKIE = "fc_access";
export const REFRESH_COOKIE = "fc_refresh";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.[ACCESS_COOKIE];
    if (!token) throw new UnauthorizedException("Not authenticated");

    let payload: { sub: string; tokenVersion: number };
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev-access",
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired session");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException("Session no longer valid");
    }

    const permissions = ROLE_PERMISSIONS[user.role.name as RoleName] ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).user = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };
    return true;
  }
}
