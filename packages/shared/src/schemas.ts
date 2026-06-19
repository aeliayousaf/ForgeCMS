import { z } from "zod";
import { pageDocumentSchema } from "./blocks.js";

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(200);

export const setupSiteSchema = z.object({
  siteName: z.string().min(1).max(120),
  siteDescription: z.string().max(500).optional().default(""),
});

export const setupAdminSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: passwordSchema,
});

export const setupThemeSchema = z.object({
  themeKey: z.string().min(1),
});

export const setupAiSchema = z.object({
  apiKey: z.string().optional().default(""),
  baseUrl: z.string().url().optional(),
  model: z.string().optional(),
});

export const setupCompleteSchema = z.object({
  site: setupSiteSchema,
  admin: setupAdminSchema,
  theme: setupThemeSchema,
  ai: setupAiSchema.optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totp: z.string().optional(),
});

export const createPageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  document: pageDocumentSchema.optional(),
});

export const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(400).optional(),
  ogImage: z.string().optional(),
  document: pageDocumentSchema.optional(),
});

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().max(500).optional(),
  document: pageDocumentSchema.optional(),
});

export const aiCreateWebsiteSchema = z.object({
  businessName: z.string().min(1).max(160),
  industry: z.string().min(1).max(160),
  services: z.string().min(1).max(2000),
  audience: z.string().min(1).max(500),
  style: z.string().min(1).max(160),
});

export const aiBuildSiteSchema = z.object({
  prompt: z.string().min(20, "Describe your business in at least a few words").max(4000),
  publish: z.boolean().optional().default(false),
});

export const aiGenerateSchema = z.object({
  kind: z.enum([
    "page",
    "post",
    "rewrite",
    "seo",
    "faq",
    "cta",
    "imagePrompt",
    "layout",
  ]),
  prompt: z.string().min(1).max(4000),
  context: z.string().max(8000).optional(),
});

export type SetupCompleteInput = z.infer<typeof setupCompleteSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AiCreateWebsiteInput = z.infer<typeof aiCreateWebsiteSchema>;
export type AiBuildSiteInput = z.infer<typeof aiBuildSiteSchema>;
