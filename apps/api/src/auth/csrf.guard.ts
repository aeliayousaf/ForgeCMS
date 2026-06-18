import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { IS_PUBLIC_KEY } from "../common/decorators";

export const CSRF_COOKIE = "fc_csrf";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Double-submit cookie CSRF protection: mutating requests must echo the
// CSRF cookie value in the x-csrf-token header.
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method)) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const cookie = req.cookies?.[CSRF_COOKIE];
    const header = req.headers["x-csrf-token"];
    if (!cookie || !header || cookie !== header) {
      throw new ForbiddenException("Invalid CSRF token");
    }
    return true;
  }
}
