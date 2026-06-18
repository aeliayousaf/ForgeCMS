import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ForgeCMS",
  description: "AI-powered self-hosted website builder",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
