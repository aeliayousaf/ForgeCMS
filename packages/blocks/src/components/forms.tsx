"use client";

import { useState } from "react";
import { z } from "zod";
import type { BlockDefinition } from "../types.js";

const apiBase =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) || "/api";

// ----- Contact Form -----
const contactSchema = z.object({
  title: z.string().default("Contact us"),
  submitLabel: z.string().default("Send"),
  fields: z.array(z.string()).default(["name", "email", "message"]),
});
type ContactProps = z.infer<typeof contactSchema>;

function ContactForm({ props, className, style }: { props: ContactProps; className?: string; style?: Record<string, string> }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`${apiBase}/forms/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className={className} style={{ padding: "3rem 1.5rem", maxWidth: 560, margin: "0 auto", ...style }}>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>{props.title}</h2>
      {status === "sent" ? (
        <p>Thanks! Your message has been received.</p>
      ) : (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem" }}>
          {props.fields.includes("name") && (
            <input name="name" placeholder="Your name" required className="fc-input" />
          )}
          {props.fields.includes("email") && (
            <input name="email" type="email" placeholder="Your email" required className="fc-input" />
          )}
          {props.fields.includes("message") && (
            <textarea name="message" placeholder="Your message" rows={5} required className="fc-input" />
          )}
          <button type="submit" className="fc-btn fc-btn-primary" disabled={status === "sending"}>
            {status === "sending" ? "Sending..." : props.submitLabel}
          </button>
          {status === "error" && <p style={{ color: "#dc2626" }}>Something went wrong. Try again.</p>}
        </form>
      )}
    </section>
  );
}

export const contactFormBlock: BlockDefinition<ContactProps> = {
  type: "contactForm",
  label: "Contact Form",
  category: "forms",
  icon: "Mail",
  schema: contactSchema,
  defaultProps: { title: "Contact us", submitLabel: "Send Message", fields: ["name", "email", "message"] },
  editorFields: [
    { key: "title", label: "Title", type: "text" },
    { key: "submitLabel", label: "Submit label", type: "text" },
  ],
  component: ContactForm,
};

// ----- Newsletter Form -----
const newsletterSchema = z.object({
  title: z.string().default("Subscribe to our newsletter"),
  submitLabel: z.string().default("Subscribe"),
});
type NewsletterProps = z.infer<typeof newsletterSchema>;

function NewsletterForm({ props, className, style }: { props: NewsletterProps; className?: string; style?: Record<string, string> }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`${apiBase}/forms/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className={className} style={{ padding: "3rem 1.5rem", textAlign: "center", ...style }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>{props.title}</h2>
      {status === "sent" ? (
        <p>You&rsquo;re subscribed. Thank you!</p>
      ) : (
        <form onSubmit={onSubmit} style={{ display: "flex", gap: "0.5rem", maxWidth: 420, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
          <input name="email" type="email" placeholder="you@example.com" required className="fc-input" style={{ flex: 1, minWidth: 200 }} />
          <button type="submit" className="fc-btn fc-btn-primary" disabled={status === "sending"}>
            {props.submitLabel}
          </button>
        </form>
      )}
    </section>
  );
}

export const newsletterFormBlock: BlockDefinition<NewsletterProps> = {
  type: "newsletterForm",
  label: "Newsletter Form",
  category: "forms",
  icon: "Send",
  schema: newsletterSchema,
  defaultProps: { title: "Subscribe to our newsletter", submitLabel: "Subscribe" },
  editorFields: [
    { key: "title", label: "Title", type: "text" },
    { key: "submitLabel", label: "Submit label", type: "text" },
  ],
  component: NewsletterForm,
};
