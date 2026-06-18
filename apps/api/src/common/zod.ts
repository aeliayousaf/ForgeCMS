import { BadRequestException } from "@nestjs/common";
import type { ZodType, z } from "zod";

// Parses and validates an unknown payload against a Zod schema, throwing a
// 400 with structured errors on failure. Returns the schema OUTPUT type so
// that Zod defaults/transforms are reflected (e.g. fields become required).
export function parse<S extends ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new BadRequestException({
      statusCode: 400,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
  }
  return result.data;
}
