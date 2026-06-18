import type { PrismaClient } from "@prisma/client";
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLES,
  ROLE_PERMISSIONS,
  SETTINGS_KEYS,
  type RoleName,
} from "@forgecms/shared";
import { STARTER_THEMES } from "../prisma/themes.js";
import { aboutDoc, contactDoc, homepageDoc } from "../prisma/sample-content.js";

export async function seedPermissionsAndRoles(prisma: PrismaClient) {
  for (const key of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    });
  }

  const permissions = await prisma.permission.findMany();
  const permByKey = new Map(permissions.map((p) => [p.key, p.id]));

  for (const roleName of DEFAULT_ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} role` },
    });

    const wanted = ROLE_PERMISSIONS[roleName as RoleName];
    for (const permKey of wanted) {
      const permissionId = permByKey.get(permKey);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }
}

export async function seedThemes(prisma: PrismaClient) {
  for (const theme of STARTER_THEMES) {
    await prisma.theme.upsert({
      where: { key: theme.key },
      update: {
        name: theme.name,
        category: theme.category,
        preview: theme.preview,
        config: theme.config as object,
      },
      create: {
        key: theme.key,
        name: theme.name,
        category: theme.category,
        preview: theme.preview,
        config: theme.config as object,
        isBuiltIn: true,
      },
    });
  }
}

export async function activateTheme(prisma: PrismaClient, themeKey: string) {
  await prisma.theme.updateMany({ data: { isActive: false } });
  const theme = await prisma.theme.update({
    where: { key: themeKey },
    data: { isActive: true },
  });
  await setSetting(prisma, SETTINGS_KEYS.activeThemeKey, themeKey);
  return theme;
}

export async function setSetting(
  prisma: PrismaClient,
  key: string,
  value: string,
  encrypted = false,
) {
  await prisma.settings.upsert({
    where: { key },
    update: { value, encrypted },
    create: { key, value, encrypted },
  });
}

export async function seedSampleContent(
  prisma: PrismaClient,
  siteName: string,
  themeId: string | null,
) {
  const pages = [
    { title: siteName, slug: "home", isHomepage: true, doc: homepageDoc(siteName) },
    { title: "About", slug: "about", isHomepage: false, doc: aboutDoc(siteName) },
    { title: "Contact", slug: "contact", isHomepage: false, doc: contactDoc() },
  ];

  for (const p of pages) {
    const existing = await prisma.page.findUnique({ where: { slug: p.slug } });
    if (existing) continue;
    await prisma.page.create({
      data: {
        title: p.title,
        slug: p.slug,
        status: "published",
        isHomepage: p.isHomepage,
        themeId,
        publishedDoc: p.doc as object,
        publishedAt: new Date(),
        versions: {
          create: { version: 1, document: p.doc as object, isPublished: true },
        },
      },
    });
  }
}

export async function seedDefaultMenu(prisma: PrismaClient) {
  const existing = await prisma.menu.findUnique({ where: { location: "primary" } });
  if (existing) return;
  await prisma.menu.create({
    data: {
      name: "Primary Menu",
      location: "primary",
      items: {
        create: [
          { label: "Home", url: "/", order: 0 },
          { label: "About", url: "/about", order: 1 },
          { label: "Contact", url: "/contact", order: 2 },
        ],
      },
    },
  });
}
