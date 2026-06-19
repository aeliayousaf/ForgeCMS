import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { Permissions } from "../../common/decorators";
import { PermissionsGuard } from "../../auth/permissions.guard";
import { PERMISSIONS } from "@forgecms/shared";
import { ReactBitsService } from "./react-bits.service";

@Controller("integrations/react-bits")
@UseGuards(PermissionsGuard)
export class ReactBitsController {
  constructor(private readonly reactBits: ReactBitsService) {}

  @Permissions(PERMISSIONS.PAGE_READ)
  @Get()
  search(@Query("q") q?: string, @Query("limit") limit?: string) {
    const n = limit ? Math.min(Number(limit) || 30, 100) : 30;
    return this.reactBits.search(q, n);
  }

  @Permissions(PERMISSIONS.PAGE_READ)
  @Get(":slug")
  getOne(@Param("slug") slug: string) {
    return this.reactBits.getBySlug(slug);
  }
}
