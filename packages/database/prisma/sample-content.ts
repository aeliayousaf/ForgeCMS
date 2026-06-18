import type { PageDocument } from "@forgecms/shared";

const id = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

export const homepageDoc = (siteName: string): PageDocument => ({
  version: 1,
  blocks: [
    {
      id: id("hero"),
      type: "hero",
      props: {
        title: `Welcome to ${siteName}`,
        subtitle: "Build beautiful, fast websites without writing a line of code.",
        primaryLabel: "Get Started",
        primaryHref: "/contact",
        secondaryLabel: "Learn More",
        secondaryHref: "/about",
        image: "",
      },
    },
    {
      id: id("features"),
      type: "features",
      props: {
        title: "Everything you need",
        items: [
          { title: "Drag & Drop", description: "Compose pages visually with reusable blocks." },
          { title: "AI Assisted", description: "Generate copy and full pages in seconds." },
          { title: "Self Hosted", description: "You own your data and your infrastructure." },
        ],
      },
    },
    {
      id: id("cta"),
      type: "cta",
      props: {
        title: "Ready to launch?",
        subtitle: "Create your first page in minutes.",
        buttonLabel: "Start Building",
        buttonHref: "/contact",
      },
    },
  ],
});

export const aboutDoc = (siteName: string): PageDocument => ({
  version: 1,
  blocks: [
    {
      id: id("heading"),
      type: "heading",
      props: { text: `About ${siteName}`, level: 1 },
    },
    {
      id: id("text"),
      type: "text",
      props: {
        html: `<p>${siteName} is built with ForgeCMS, a modern self-hosted website builder. Replace this text with your own story.</p>`,
      },
    },
  ],
});

export const contactDoc = (): PageDocument => ({
  version: 1,
  blocks: [
    {
      id: id("heading"),
      type: "heading",
      props: { text: "Contact Us", level: 1 },
    },
    {
      id: id("contact"),
      type: "contactForm",
      props: {
        title: "Get in touch",
        submitLabel: "Send Message",
        fields: ["name", "email", "message"],
      },
    },
  ],
});
