import { z } from "zod";
import type { BlockDefinition } from "../types.js";

// ----- Feature Grid -----
const featuresSchema = z.object({
  title: z.string().default(""),
  items: z
    .array(z.object({ title: z.string(), description: z.string().default("") }))
    .default([]),
});
type FeaturesProps = z.infer<typeof featuresSchema>;

export const featuresBlock: BlockDefinition<FeaturesProps> = {
  type: "features",
  label: "Feature Grid",
  category: "marketing",
  icon: "Grid3x3",
  schema: featuresSchema,
  defaultProps: {
    title: "Features",
    items: [
      { title: "Fast", description: "Blazing fast performance." },
      { title: "Secure", description: "Security-first architecture." },
      { title: "Flexible", description: "Build anything you imagine." },
    ],
  },
  editorFields: [
    { key: "title", label: "Title", type: "text" },
    {
      key: "items",
      label: "Features",
      type: "list",
      itemFields: [
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
      ],
    },
  ],
  component: ({ props, className, style }) => (
    <section className={className} style={{ padding: "4rem 1.5rem", ...style }}>
      {props.title && (
        <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 700, marginBottom: "2.5rem" }}>{props.title}</h2>
      )}
      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          maxWidth: 1080,
          margin: "0 auto",
        }}
      >
        {props.items.map((it, i) => (
          <div key={i} style={{ padding: "1.5rem", borderRadius: "var(--radius,0.5rem)", background: "var(--color-surface,#f8fafc)" }}>
            <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{it.title}</h3>
            <p style={{ opacity: 0.75 }}>{it.description}</p>
          </div>
        ))}
      </div>
    </section>
  ),
};

// ----- Testimonials -----
const testimonialsSchema = z.object({
  title: z.string().default("What our customers say"),
  items: z
    .array(z.object({ quote: z.string(), author: z.string(), role: z.string().default("") }))
    .default([]),
});
type TestimonialsProps = z.infer<typeof testimonialsSchema>;

export const testimonialsBlock: BlockDefinition<TestimonialsProps> = {
  type: "testimonials",
  label: "Testimonials",
  category: "marketing",
  icon: "Quote",
  schema: testimonialsSchema,
  defaultProps: {
    title: "What our customers say",
    items: [{ quote: "This product changed how we work.", author: "Jane Doe", role: "CEO, Acme" }],
  },
  editorFields: [
    { key: "title", label: "Title", type: "text" },
    {
      key: "items",
      label: "Testimonials",
      type: "list",
      itemFields: [
        { key: "quote", label: "Quote", type: "textarea" },
        { key: "author", label: "Author", type: "text" },
        { key: "role", label: "Role", type: "text" },
      ],
    },
  ],
  component: ({ props, className, style }) => (
    <section className={className} style={{ padding: "4rem 1.5rem", background: "var(--color-surface,#f8fafc)", ...style }}>
      <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 700, marginBottom: "2.5rem" }}>{props.title}</h2>
      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", maxWidth: 1080, margin: "0 auto" }}>
        {props.items.map((t, i) => (
          <blockquote key={i} style={{ background: "var(--color-background,#fff)", padding: "1.5rem", borderRadius: 12, margin: 0 }}>
            <p style={{ fontStyle: "italic", marginBottom: "1rem" }}>&ldquo;{t.quote}&rdquo;</p>
            <footer style={{ fontWeight: 600 }}>
              {t.author}
              {t.role && <span style={{ opacity: 0.6, fontWeight: 400 }}> — {t.role}</span>}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  ),
};

// ----- FAQ -----
const faqSchema = z.object({
  title: z.string().default("Frequently asked questions"),
  items: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
});
type FaqProps = z.infer<typeof faqSchema>;

export const faqBlock: BlockDefinition<FaqProps> = {
  type: "faq",
  label: "FAQ",
  category: "content",
  icon: "HelpCircle",
  schema: faqSchema,
  defaultProps: {
    title: "Frequently asked questions",
    items: [{ question: "How do I get started?", answer: "Complete the setup wizard and start building." }],
  },
  editorFields: [
    { key: "title", label: "Title", type: "text" },
    {
      key: "items",
      label: "Questions",
      type: "list",
      itemFields: [
        { key: "question", label: "Question", type: "text" },
        { key: "answer", label: "Answer", type: "textarea" },
      ],
    },
  ],
  component: ({ props, className, style }) => (
    <section className={className} style={{ padding: "4rem 1.5rem", maxWidth: 760, margin: "0 auto", ...style }}>
      <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 700, marginBottom: "2rem" }}>{props.title}</h2>
      {props.items.map((f, i) => (
        <details key={i} style={{ borderBottom: "1px solid #e2e8f0", padding: "1rem 0" }}>
          <summary style={{ fontWeight: 600, cursor: "pointer" }}>{f.question}</summary>
          <p style={{ marginTop: "0.5rem", opacity: 0.8 }}>{f.answer}</p>
        </details>
      ))}
    </section>
  ),
};

// ----- Pricing Table -----
const pricingSchema = z.object({
  title: z.string().default("Pricing"),
  plans: z
    .array(
      z.object({
        name: z.string(),
        price: z.string(),
        period: z.string().default("/mo"),
        features: z.array(z.string()).default([]),
        ctaLabel: z.string().default("Choose"),
        ctaHref: z.string().default("#"),
        highlighted: z.boolean().default(false),
      }),
    )
    .default([]),
});
type PricingProps = z.infer<typeof pricingSchema>;

export const pricingBlock: BlockDefinition<PricingProps> = {
  type: "pricing",
  label: "Pricing Table",
  category: "marketing",
  icon: "CreditCard",
  schema: pricingSchema,
  defaultProps: {
    title: "Simple pricing",
    plans: [
      { name: "Starter", price: "$0", period: "/mo", features: ["1 site", "Community support"], ctaLabel: "Start", ctaHref: "#", highlighted: false },
      { name: "Pro", price: "$29", period: "/mo", features: ["Unlimited sites", "Priority support"], ctaLabel: "Go Pro", ctaHref: "#", highlighted: true },
    ],
  },
  editorFields: [
    { key: "title", label: "Title", type: "text" },
    {
      key: "plans",
      label: "Plans",
      type: "list",
      itemFields: [
        { key: "name", label: "Name", type: "text" },
        { key: "price", label: "Price", type: "text" },
        { key: "period", label: "Period", type: "text" },
        { key: "ctaLabel", label: "Button", type: "text" },
        { key: "ctaHref", label: "Link", type: "text" },
        { key: "highlighted", label: "Highlighted", type: "boolean" },
      ],
    },
  ],
  component: ({ props, className, style }) => (
    <section className={className} style={{ padding: "4rem 1.5rem", ...style }}>
      <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 700, marginBottom: "2.5rem" }}>{props.title}</h2>
      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", maxWidth: 1000, margin: "0 auto" }}>
        {props.plans.map((p, i) => (
          <div
            key={i}
            style={{
              padding: "2rem",
              borderRadius: 16,
              border: p.highlighted ? "2px solid var(--color-primary,#1d4ed8)" : "1px solid #e2e8f0",
              background: "var(--color-background,#fff)",
            }}
          >
            <h3 style={{ fontWeight: 600 }}>{p.name}</h3>
            <p style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0.5rem 0" }}>
              {p.price}
              <span style={{ fontSize: "1rem", opacity: 0.6 }}>{p.period}</span>
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0", display: "grid", gap: "0.5rem" }}>
              {p.features.map((f, fi) => (
                <li key={fi}>✓ {f}</li>
              ))}
            </ul>
            <a href={p.ctaHref} className={`fc-btn ${p.highlighted ? "fc-btn-primary" : "fc-btn-outline"}`} style={{ width: "100%", textAlign: "center" }}>
              {p.ctaLabel}
            </a>
          </div>
        ))}
      </div>
    </section>
  ),
};

// ----- Blog Feed -----
const blogFeedSchema = z.object({
  title: z.string().default("Latest from the blog"),
  limit: z.number().min(1).max(12).default(3),
});
type BlogFeedProps = z.infer<typeof blogFeedSchema>;

export const blogFeedBlock: BlockDefinition<BlogFeedProps> = {
  type: "blogFeed",
  label: "Blog Feed",
  category: "content",
  icon: "Newspaper",
  schema: blogFeedSchema,
  defaultProps: { title: "Latest from the blog", limit: 3 },
  editorFields: [
    { key: "title", label: "Title", type: "text" },
    { key: "limit", label: "Number of posts", type: "number" },
  ],
  // Posts are injected at render time via window.__FORGE_POSTS__ when available;
  // otherwise shows a placeholder. The public renderer hydrates this server-side.
  component: ({ props, className, style }) => (
    <section className={className} style={{ padding: "4rem 1.5rem", maxWidth: 1080, margin: "0 auto", ...style }}>
      <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 700, marginBottom: "2rem" }}>{props.title}</h2>
      <p style={{ textAlign: "center", opacity: 0.6 }}>
        Recent posts will appear here ({props.limit} latest).
      </p>
    </section>
  ),
};
