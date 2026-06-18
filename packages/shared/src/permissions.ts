import type { RoleName } from "./constants.js";

export const PERMISSIONS = {
  PAGE_READ: "page:read",
  PAGE_WRITE: "page:write",
  PAGE_PUBLISH: "page:publish",
  POST_READ: "post:read",
  POST_WRITE: "post:write",
  MEDIA_READ: "media:read",
  MEDIA_WRITE: "media:write",
  THEME_MANAGE: "theme:manage",
  MENU_MANAGE: "menu:manage",
  COMPONENT_MANAGE: "component:manage",
  USER_MANAGE: "user:manage",
  AI_USE: "ai:use",
  SETTINGS_MANAGE: "settings:manage",
  SECURITY_MANAGE: "security:manage",
  BACKUP_MANAGE: "backup:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  admin: ALL_PERMISSIONS,
  editor: [
    PERMISSIONS.PAGE_READ,
    PERMISSIONS.PAGE_WRITE,
    PERMISSIONS.PAGE_PUBLISH,
    PERMISSIONS.POST_READ,
    PERMISSIONS.POST_WRITE,
    PERMISSIONS.MEDIA_READ,
    PERMISSIONS.MEDIA_WRITE,
    PERMISSIONS.THEME_MANAGE,
    PERMISSIONS.MENU_MANAGE,
    PERMISSIONS.COMPONENT_MANAGE,
    PERMISSIONS.AI_USE,
  ],
  author: [
    PERMISSIONS.PAGE_READ,
    PERMISSIONS.POST_READ,
    PERMISSIONS.POST_WRITE,
    PERMISSIONS.MEDIA_READ,
    PERMISSIONS.MEDIA_WRITE,
    PERMISSIONS.AI_USE,
  ],
  viewer: [
    PERMISSIONS.PAGE_READ,
    PERMISSIONS.POST_READ,
    PERMISSIONS.MEDIA_READ,
  ],
};
