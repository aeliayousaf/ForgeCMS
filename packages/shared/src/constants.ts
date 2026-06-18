export const APP_NAME = "ForgeCMS";

export const SETTINGS_KEYS = {
  installComplete: "install_complete",
  siteName: "site_name",
  siteDescription: "site_description",
  activeThemeKey: "active_theme_key",
  aiApiKey: "ai_api_key",
  aiBaseUrl: "ai_base_url",
  aiModel: "ai_model",
  robotsTxt: "robots_txt",
  backupSchedule: "backup_schedule",
} as const;

export const PAGE_STATUS = {
  draft: "draft",
  published: "published",
} as const;

export type PageStatus = (typeof PAGE_STATUS)[keyof typeof PAGE_STATUS];

export const DEFAULT_ROLES = ["admin", "editor", "author", "viewer"] as const;
export type RoleName = (typeof DEFAULT_ROLES)[number];

export const ALLOWED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

export const ALLOWED_DOC_MIME = ["application/pdf"] as const;

export const ALLOWED_VIDEO_MIME = ["video/mp4", "video/webm"] as const;

export const ALLOWED_UPLOAD_MIME = [
  ...ALLOWED_IMAGE_MIME,
  ...ALLOWED_DOC_MIME,
  ...ALLOWED_VIDEO_MIME,
] as const;
