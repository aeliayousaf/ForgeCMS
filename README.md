# ForgeCMS

ForgeCMS is an AI-powered, self-hosted website builder. It combines a visual
drag-and-drop page builder, a theme engine, a media library, AI content
generation, and a security-first backend into a single application you run on
your own server.

- Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, dnd-kit
- Backend: NestJS REST API, Prisma ORM, MySQL 8
- Auth: JWT (httpOnly cookies) with Argon2id password hashing and optional TOTP 2FA
- Deploy: Docker Compose with an Nginx reverse proxy

> ForgeCMS follows enterprise-grade security practices. No software is
> "unhackable"; keep your secrets safe and your server patched.

## Quick start (Docker)

Prerequisites: Docker and Docker Compose.

```bash
cp .env.example .env
# Edit .env and change the secrets (JWT_*, SETTINGS_ENCRYPTION_KEY, DB passwords)
docker compose up -d
```

Then open `http://localhost` in your browser. The first launch shows the setup
wizard, which walks you through:

1. Site name and description
2. Admin account
3. Database connection test
4. Theme selection
5. Optional AI API key
6. Finish

When you click finish, ForgeCMS creates the database tables, your admin account,
a default homepage plus sample pages, activates your theme, and logs you in. No
manual configuration files to edit.

## Architecture

```
forgecms/
├── apps/
│   ├── api/        NestJS API (auth, content, media, AI, backups)
│   └── web/        Next.js app (setup wizard, admin, public site)
├── packages/
│   ├── database/   Prisma schema, client, seed logic, themes
│   ├── shared/     Zod schemas, block types, permissions, constants
│   └── blocks/     React block components, registry, renderer, layouts
└── docker/         Dockerfiles + nginx config
```

Nginx routes `/api/*` to NestJS and everything else to Next.js, keeping cookies
same-origin. Pages are stored as structured JSON (`PageDocument`) and rendered
on the public site by mapping each block to its React component.

## Local development

Prerequisites: Node 20+, pnpm 9, and a MySQL instance.

```bash
pnpm install
pnpm db:generate

# Point DATABASE_URL at your local MySQL, then create the tables:
pnpm --filter @forgecms/database db:push
pnpm --filter @forgecms/database seed   # roles, permissions, themes

pnpm dev   # runs the API (:4000) and web (:3000) together
```

Visit `http://localhost:3000` and complete the setup wizard. In dev, the web app
proxies `/api` to `http://localhost:4000` automatically.

## React Bits integration

The page builder includes a searchable **React Bits** panel ([reactbits.dev](https://reactbits.dev))
with all **134** pre-bundled `TS-TW` components (backgrounds, text effects, animations, interactive widgets).

**In the builder:** open the left sidebar → **React Bits** → search → click or drag onto the canvas.

**Extend or refresh the catalog (developers):**

1. Enable the shadcn MCP server in Cursor (`.cursor/mcp.json` is included).
2. Regenerate the full catalog from the registry: `pnpm --filter @forgecms/web react-bits:catalog`
3. Or add individual slugs to `packages/shared/react-bits.catalog.json` (use `*-TS-TW` variants).
4. Run `pnpm --filter @forgecms/web react-bits:sync` to install via shadcn and regenerate the manifest.
5. Rebuild the web app / Docker `web` image.

One-shot refresh of all components: `pnpm --filter @forgecms/web react-bits:full`

## AI on VPS / self-hosted servers

OpenAI (`api.openai.com`) often **blocks datacenter IPs** with a Cloudflare 403 — your API logs may show HTML instead of JSON. Use an OpenAI-compatible proxy such as [OpenRouter](https://openrouter.ai):

| Setting | Value |
|---------|--------|
| Base URL | `https://openrouter.ai/api/v1` |
| API key | Your OpenRouter key |
| Model | `openai/gpt-4o-mini` |

Configure under **Admin → Settings → AI Integration**, then rebuild the `api` container if you changed code.

`apps/web/components.json` registers the `@react-bits` registry per the
[React Bits MCP guide](https://reactbits.dev/get-started/mcp).

## Features

- Installer wizard, no config editing required
- Visual builder with layout blocks (section/column), 16+ widgets, and React Bits components
- Page versions, drafts, publish/unpublish, duplicate, save-as-component
- Theme engine with 10 starter themes; switch themes without losing content
- Media library with upload validation, magic-byte checks, and thumbnails
- AI Assistant: build a full site from one prompt (pages, menu, theme) or generate copy
- Role-based access control (admin/editor/author/viewer)
- Backups: manual and scheduled database + file backups with restore
- SEO: per-page metadata, `sitemap.xml`, `robots.txt`

## Security

- Argon2id password hashing; sessions invalidated on password change
- JWT access/refresh tokens in httpOnly, SameSite=Strict cookies
- Double-submit-cookie CSRF protection on mutating requests
- Rate limiting on auth and AI endpoints (`@nestjs/throttler`)
- Server-side HTML sanitization (DOMPurify) for Text and Custom HTML blocks
- Upload MIME allow-list, size limits, and magic-byte verification
- Audit logging of sensitive actions; viewable under Security
- Secrets via environment variables; AI keys encrypted at rest (AES-256-GCM)
- Optional TOTP two-factor authentication

## Testing

```bash
pnpm --filter @forgecms/api test
```

## Roadmap (deferred from MVP)

Plugin marketplace, ecommerce, memberships, multi-site/white-label, S3 storage
(the storage adapter interface is already in place), and SMTP email delivery for
form submissions (currently logged to the audit trail).
