import { BLOCK_TYPES, THEME_KEYS } from "@forgecms/shared";

export const SYSTEM_BLOCKS = `You are ForgeCMS's website content generator. You output website
content using ONLY these block types: ${BLOCK_TYPES.join(", ")}.

A page document has this exact shape:
{
  "version": 1,
  "blocks": [
    { "id": "<unique-string>", "type": "<one of the allowed types>", "props": { ... }, "children": [...] }
  ]
}

Blocks may nest via optional "children" arrays (layout blocks: section, container, column).

Block prop guidance:
- section: { fullWidth, maxWidth, paddingY, paddingX, backgroundColor }
- container: { gap, direction, align, justify, wrap }
- column: { widthPercent }
- hero: { title, subtitle, primaryLabel, primaryHref, secondaryLabel, secondaryHref }
- heading: { text, level }
- text: { html }  (simple semantic HTML only: p, ul, li, strong, em, a)
- features: { title, items:[{title, description}] }
- testimonials: { title, items:[{quote, author, role}] }
- faq: { title, items:[{question, answer}] }
- pricing: { title, plans:[{name, price, period, features:[string], ctaLabel, ctaHref, highlighted}] }
- cta: { title, subtitle, buttonLabel, buttonHref }
- contactForm: { title, submitLabel, fields:["name","email","message"] }
- button: { label, href, variant, size }

Site header, footer, and navigation are provided automatically by the theme — do NOT add header/footer blocks.
Always return STRICTLY valid JSON with no markdown fencing or commentary.`;

export const BUILD_SITE_PLAN_SYSTEM = `You are ForgeCMS's website planner. You output site structure and copy briefs — not page block JSON.
Available theme keys: ${THEME_KEYS.join(", ")}
Always return STRICTLY valid JSON with no markdown fencing or commentary.`;

export const buildSitePlanPrompt = (userPrompt: string) => `Plan a small business website from this description:

"""
${userPrompt}
"""

Return STRICTLY valid JSON of this shape:
{
  "siteName": "Business Name",
  "siteDescription": "Short SEO tagline (one sentence)",
  "themeKey": "business",
  "menu": [
    { "label": "Home", "url": "/" },
    { "label": "About", "url": "/about" },
    { "label": "Contact", "url": "/contact" }
  ],
  "pages": [
    { "title": "Home", "slug": "home", "summary": "One sentence: hero headline angle, 3 feature topics, testimonial theme, CTA goal" },
    { "title": "About", "slug": "about", "summary": "One sentence: company story and value props to cover" },
    { "title": "Contact", "slug": "contact", "summary": "One sentence: invite contact, mention location or hours if relevant" }
  ]
}

Requirements:
- Exactly 3 pages: Home, one main page (About or Services — pick what fits), and Contact.
- If the description is brief or vague, infer sensible marketing copy (features, audience, CTA).
- Menu must list every page; home uses url "/" (not "/home").
- Summaries must be specific to the business — no lorem ipsum.
- themeKey must be one of: ${THEME_KEYS.join(", ")}.`;

export const buildSitePagePrompt = (input: {
  userPrompt: string;
  siteName: string;
  title: string;
  slug: string;
  summary: string;
}) => `Build ONE page for "${input.siteName}".

Business description:
"""
${input.userPrompt}
"""

Page: ${input.title} (slug: ${input.slug})
Content brief: ${input.summary}

Return STRICTLY valid JSON — a single page document only:
{ "version": 1, "blocks": [...] }

Requirements:
- 4–5 blocks maximum. Keep all copy concise.
- Wrap blocks in section containers where helpful.
- Home (slug home): hero, features (3 items), testimonials (2 items), cta.
- Contact (slug contact): heading, short text, contactForm block.
- Other pages: heading, text, and one of features/faq/cta as appropriate.
- Each block needs a unique "id". Realistic copy tailored to the business.`;

export const websitePrompt = (input: {
  businessName: string;
  industry: string;
  services: string;
  audience: string;
  style: string;
}) => `Create a small professional website for this business.

Business name: ${input.businessName}
Industry: ${input.industry}
Services: ${input.services}
Target audience: ${input.audience}
Preferred style/tone: ${input.style}

Return STRICTLY valid JSON of this shape:
{
  "pages": [
    { "title": "Home", "slug": "home", "document": { "version": 1, "blocks": [...] } },
    { "title": "About", "slug": "about", "document": { "version": 1, "blocks": [...] } },
    { "title": "Services", "slug": "services", "document": { "version": 1, "blocks": [...] } },
    { "title": "Contact", "slug": "contact", "document": { "version": 1, "blocks": [...] } }
  ]
}
The Home page should start with a hero, then features, testimonials and a cta.
The Contact page should include a contactForm block. Use realistic, specific copy.`;
