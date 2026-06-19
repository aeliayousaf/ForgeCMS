import { Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface ReactBitsCatalogItem {
  slug: string;
  category?: string;
  supportsChildren?: boolean;
}

export interface ReactBitsComponentDto {
  slug: string;
  title: string;
  description: string;
  category: string;
  supportsChildren: boolean;
  dependencies: string[];
}

interface RegistryItem {
  name: string;
  title?: string;
  description?: string;
  dependencies?: string[];
}

const REGISTRY_URL = "https://reactbits.dev/r/registry.json";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ReactBitsService implements OnModuleInit {
  private readonly logger = new Logger(ReactBitsService.name);
  private catalog: ReactBitsCatalogItem[] = [];
  private registryItems = new Map<string, RegistryItem>();
  private fetchedAt = 0;

  onModuleInit() {
    this.catalog = this.loadCatalog();
    void this.refreshRegistry();
  }

  private loadCatalog(): ReactBitsCatalogItem[] {
    const candidates = [
      join(process.cwd(), "packages/shared/react-bits.catalog.json"),
      join(process.cwd(), "../../packages/shared/react-bits.catalog.json"),
      join(__dirname, "../../../../../packages/shared/react-bits.catalog.json"),
    ];
    for (const p of candidates) {
      try {
        const raw = JSON.parse(readFileSync(p, "utf8"));
        return raw.components ?? [];
      } catch {
        // try next path
      }
    }
    this.logger.warn("react-bits.catalog.json not found — integration disabled");
    return [];
  }

  private async refreshRegistry() {
    try {
      const res = await fetch(REGISTRY_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items: RegistryItem[] };
      this.registryItems = new Map(data.items.map((i) => [i.name, i]));
      this.fetchedAt = Date.now();
      this.logger.log(`React Bits registry cached (${this.registryItems.size} items)`);
    } catch (err) {
      this.logger.error("Failed to fetch React Bits registry", err);
    }
  }

  private async ensureRegistry() {
    if (Date.now() - this.fetchedAt > CACHE_TTL_MS) {
      await this.refreshRegistry();
    }
  }

  private catalogSlugs(): Set<string> {
    return new Set(this.catalog.map((c) => c.slug));
  }

  private toDto(slug: string): ReactBitsComponentDto | null {
    const cat = this.catalog.find((c) => c.slug === slug);
    const reg = this.registryItems.get(slug);
    if (!cat || !reg) return null;
    return {
      slug,
      title: reg.title ?? slug.replace(/-TS-TW$/, ""),
      description: reg.description ?? "",
      category: cat.category ?? "other",
      supportsChildren: Boolean(cat.supportsChildren),
      dependencies: reg.dependencies ?? [],
    };
  }

  async search(query?: string, limit = 30): Promise<ReactBitsComponentDto[]> {
    await this.ensureRegistry();
    const slugs = this.catalogSlugs();
    let results = [...slugs]
      .map((slug) => this.toDto(slug))
      .filter((d): d is ReactBitsComponentDto => d !== null);

    const q = query?.trim().toLowerCase();
    if (q) {
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q),
      );
    }

    return results.slice(0, Math.min(limit, 100));
  }

  async getBySlug(slug: string): Promise<ReactBitsComponentDto> {
    await this.ensureRegistry();
    if (!this.catalogSlugs().has(slug)) {
      throw new NotFoundException("Component not in catalog");
    }
    const dto = this.toDto(slug);
    if (!dto) throw new NotFoundException("Component metadata not found");
    return dto;
  }

  isAllowedSlug(slug: string): boolean {
    return this.catalogSlugs().has(slug);
  }
}
