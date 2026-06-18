import { BLOCK_TYPES } from "@forgecms/shared";

export const SYSTEM_BLOCKS = `You are ForgeCMS's website content generator. You output website
content using ONLY these block types: ${BLOCK_TYPES.join(", ")}.

A page document has this exact shape:
{
  "version": 1,
  "blocks": [
    { "id": "<unique-string>", "type": "<one of the allowed types>", "props": { ... } }
  ]
}

Block prop guidance:
- hero: { title, subtitle, primaryLabel, primaryHref, secondaryLabel, secondaryHref }
- heading: { text, level }
- text: { html }  (simple semantic HTML only: p, ul, li, strong, em, a)
- features: { title, items:[{title, description}] }
- testimonials: { title, items:[{quote, author, role}] }
- faq: { title, items:[{question, answer}] }
- pricing: { title, plans:[{name, price, period, features:[string], ctaLabel, ctaHref, highlighted}] }
- cta: { title, subtitle, buttonLabel, buttonHref }
- contactForm: { title, submitLabel, fields:["name","email","message"] }
Always return STRICTLY valid JSON with no markdown fencing or commentary.`;

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
