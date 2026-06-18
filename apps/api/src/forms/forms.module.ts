import { Body, Controller, Injectable, Module, Post, Req, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import type { Request } from "express";
import { AuditService } from "../audit/audit.service";
import { Public } from "../common/decorators";
import { parse } from "../common/zod";
import { z } from "zod";

@Injectable()
export class FormsService {
  constructor(private readonly audit: AuditService) {}

  // MVP: form submissions are logged via the audit trail. SMTP delivery is a
  // documented v2 enhancement.
  async submit(kind: string, payload: Record<string, unknown>, ip?: string) {
    await this.audit.log({
      action: "submit",
      entity: `form:${kind}`,
      ip,
      metadata: payload,
    });
    return { ok: true };
  }
}

@Public()
@Controller("forms")
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 5, ttl: 60_000 } })
export class FormsController {
  constructor(private readonly forms: FormsService) {}

  @Post("contact")
  contact(@Body() body: unknown, @Req() req: Request) {
    const dto = parse(
      z.object({
        name: z.string().min(1).max(200),
        email: z.string().email(),
        message: z.string().min(1).max(5000),
      }),
      body,
    );
    return this.forms.submit("contact", dto, req.ip);
  }

  @Post("newsletter")
  newsletter(@Body() body: unknown, @Req() req: Request) {
    const dto = parse(z.object({ email: z.string().email() }), body);
    return this.forms.submit("newsletter", dto, req.ip);
  }
}

@Module({
  providers: [FormsService],
  controllers: [FormsController],
})
export class FormsModule {}
