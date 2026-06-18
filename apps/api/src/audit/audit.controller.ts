import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { Permissions } from "../common/decorators";
import { PermissionsGuard } from "../auth/permissions.guard";
import { PERMISSIONS } from "@forgecms/shared";

@Controller("audit")
@UseGuards(PermissionsGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Permissions(PERMISSIONS.SECURITY_MANAGE)
  @Get()
  list() {
    return this.audit.list(200);
  }
}
