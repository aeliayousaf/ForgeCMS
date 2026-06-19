import { createElement } from "react";
import { z } from "zod";
import type { BlockDefinition } from "../types.js";

// ----- Hero -----
const heroSchema = z.object({
  title: z.string(),
  subtitle: z.string().default(""),
  primaryLabel: z.string().default(""),
  primaryHref: z.string().default("#"),
  secondaryLabel: z.string().default(""),
  secondaryHref: z.string().default("#"),
  image: z.string().default(""),
});
type HeroProps = z.infer<typeof heroSchema>;

export const heroBlock: BlockDefinition<HeroProps> = {
  type: "hero",
  label: "Hero",
  category: "layout",
  icon: "Sparkles",
  schema: heroSchema,
  defaultProps: {
    title: "Your headline here",
    subtitle: "A short supporting sentence that explains the value.",
    primaryLabel: "Get Started",
    primaryHref: "#",
    secondaryLabel: "",
    secondaryHref: "#",
    image: "",
  },
  editorFields: [
    { key: "title", label: "Title", type: "text" },
    { key: "subtitle", label: "Subtitle", type: "textarea" },
    { key: "primaryLabel", label: "Primary button", type: "text" },
    { key: "primaryHref", label: "Primary link", type: "text" },
    { key: "secondaryLabel", label: "Secondary button", type: "text" },
    { key: "secondaryHref", label: "Secondary link", type: "text" },
    { key: "image", label: "Background image", type: "image" },
  ],
  component: ({ props, className, style }) => (
    <section
      className={`fc-hero ${className ?? ""}`}
      style={{
        padding: "6rem 1.5rem",
        textAlign: "center",
        backgroundImage: props.image ? `url(${props.image})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        ...style,
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 800, marginBottom: "1rem" }}>
          {props.title}
        </h1>
        {props.subtitle && (
          <p style={{ fontSize: "1.25rem", opacity: 0.8, marginBottom: "2rem" }}>{props.subtitle}</p>
        )}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          {props.primaryLabel && (
            <a href={props.primaryHref} className="fc-btn fc-btn-primary">
              {props.primaryLabel}
            </a>
          )}
          {props.secondaryLabel && (
            <a href={props.secondaryHref} className="fc-btn fc-btn-outline">
              {props.secondaryLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  ),
};

// ----- Heading -----
const headingSchema = z.object({
  text: z.string(),
  level: z.number().min(1).max(6).default(2),
});
type HeadingProps = z.infer<typeof headingSchema>;

export const headingBlock: BlockDefinition<HeadingProps> = {
  type: "heading",
  label: "Heading",
  category: "content",
  icon: "Heading",
  schema: headingSchema,
  defaultProps: { text: "Section heading", level: 2 },
  editorFields: [
    { key: "text", label: "Text", type: "text" },
    {
      key: "level",
      label: "Level",
      type: "select",
      options: [1, 2, 3, 4, 5, 6].map((n) => ({ label: `H${n}`, value: String(n) })),
    },
  ],
  component: ({ props, className, style }) => {
    const level = Math.min(Math.max(props.level, 1), 6);
    return createElement(
      `h${level}`,
      {
        className,
        style: { fontWeight: 700, padding: "0.5rem 1.5rem", maxWidth: 960, margin: "0 auto", ...style },
      },
      props.text,
    );
  },
};

// ----- Text -----
const textSchema = z.object({ html: z.string() });
type TextProps = z.infer<typeof textSchema>;

export const textBlock: BlockDefinition<TextProps> = {
  type: "text",
  label: "Text Block",
  category: "content",
  icon: "Type",
  schema: textSchema,
  defaultProps: { html: "<p>Write your content here.</p>" },
  editorFields: [{ key: "html", label: "Content", type: "richtext" }],
  component: ({ props, className, style }) => (
    <div
      className={`fc-prose ${className ?? ""}`}
      style={{ maxWidth: 760, margin: "0 auto", padding: "1rem 1.5rem", ...style }}
      dangerouslySetInnerHTML={{ __html: props.html }}
    />
  ),
};

// ----- Button -----
const buttonSchema = z.object({
  label: z.string(),
  href: z.string().default("#"),
  variant: z.enum(["primary", "outline", "ghost"]).default("primary"),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  backgroundColor: z.string().default(""),
  textColor: z.string().default(""),
  borderColor: z.string().default(""),
});
type ButtonProps = z.infer<typeof buttonSchema>;

function buttonInlineStyle(props: ButtonProps): Record<string, string> {
  const style: Record<string, string> = {};
  if (props.backgroundColor) style.background = props.backgroundColor;
  if (props.textColor) style.color = props.textColor;
  if (props.borderColor) style.borderColor = props.borderColor;
  return style;
}

export const buttonBlock: BlockDefinition<ButtonProps> = {
  type: "button",
  label: "Button",
  category: "content",
  icon: "MousePointerClick",
  schema: buttonSchema,
  defaultProps: {
    label: "Click me",
    href: "#",
    variant: "primary",
    size: "md",
    backgroundColor: "",
    textColor: "",
    borderColor: "",
  },
  editorFields: [
    { key: "label", label: "Label", type: "text" },
    { key: "href", label: "Link", type: "text" },
    {
      key: "variant",
      label: "Style",
      type: "select",
      options: [
        { label: "Primary (filled)", value: "primary" },
        { label: "Outline", value: "outline" },
        { label: "Ghost (text only)", value: "ghost" },
      ],
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    { key: "backgroundColor", label: "Background colour", type: "color", placeholder: "Theme default" },
    { key: "textColor", label: "Text colour", type: "color", placeholder: "Theme default" },
    { key: "borderColor", label: "Border colour", type: "color", placeholder: "Theme default" },
  ],
  component: ({ props, className, style }) => (
    <div style={{ padding: "1rem 1.5rem", textAlign: "center", ...style }} className={className}>
      <a
        href={props.href}
        className={`fc-btn fc-btn-${props.variant} fc-btn-${props.size}`}
        style={buttonInlineStyle(props)}
      >
        {props.label}
      </a>
    </div>
  ),
};

// ----- Call To Action -----
const ctaSchema = z.object({
  title: z.string(),
  subtitle: z.string().default(""),
  buttonLabel: z.string().default("Learn more"),
  buttonHref: z.string().default("#"),
});
type CtaProps = z.infer<typeof ctaSchema>;

export const ctaBlock: BlockDefinition<CtaProps> = {
  type: "cta",
  label: "Call To Action",
  category: "marketing",
  icon: "Megaphone",
  schema: ctaSchema,
  defaultProps: {
    title: "Ready to get started?",
    subtitle: "Join us today.",
    buttonLabel: "Get Started",
    buttonHref: "#",
  },
  editorFields: [
    { key: "title", label: "Title", type: "text" },
    { key: "subtitle", label: "Subtitle", type: "textarea" },
    { key: "buttonLabel", label: "Button label", type: "text" },
    { key: "buttonHref", label: "Button link", type: "text" },
  ],
  component: ({ props, className, style }) => (
    <section
      className={className}
      style={{
        padding: "4rem 1.5rem",
        textAlign: "center",
        background: "var(--color-surface, #f1f5f9)",
        ...style,
      }}
    >
      <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>{props.title}</h2>
      {props.subtitle && <p style={{ opacity: 0.8, marginBottom: "1.5rem" }}>{props.subtitle}</p>}
      <a href={props.buttonHref} className="fc-btn fc-btn-primary">
        {props.buttonLabel}
      </a>
    </section>
  ),
};
