// Built-in starter themes. Each theme is a config object consumed by the
// theme engine to produce CSS variables and pick header/footer variants.

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  radius: string;
  headerVariant: "minimal" | "centered" | "split";
  footerVariant: "simple" | "columns";
}

export interface ThemeSeed {
  key: string;
  name: string;
  category: string;
  preview: string;
  config: ThemeConfig;
}

const font = (heading: string, body: string) => ({ heading, body });

export const STARTER_THEMES: ThemeSeed[] = [
  {
    key: "business",
    name: "Business",
    category: "Corporate",
    preview: "/themes/business.svg",
    config: {
      colors: {
        primary: "#1d4ed8",
        secondary: "#0f172a",
        accent: "#3b82f6",
        background: "#ffffff",
        surface: "#f1f5f9",
        text: "#0f172a",
        muted: "#64748b",
      },
      fonts: font("Inter", "Inter"),
      radius: "0.5rem",
      headerVariant: "split",
      footerVariant: "columns",
    },
  },
  {
    key: "agency",
    name: "Agency",
    category: "Creative",
    preview: "/themes/agency.svg",
    config: {
      colors: {
        primary: "#111827",
        secondary: "#f59e0b",
        accent: "#f59e0b",
        background: "#0b0b0f",
        surface: "#16161d",
        text: "#f8fafc",
        muted: "#9ca3af",
      },
      fonts: font("Poppins", "Inter"),
      radius: "1rem",
      headerVariant: "minimal",
      footerVariant: "columns",
    },
  },
  {
    key: "saas",
    name: "SaaS",
    category: "Technology",
    preview: "/themes/saas.svg",
    config: {
      colors: {
        primary: "#7c3aed",
        secondary: "#4f46e5",
        accent: "#a855f7",
        background: "#ffffff",
        surface: "#f5f3ff",
        text: "#1e1b4b",
        muted: "#6b7280",
      },
      fonts: font("Inter", "Inter"),
      radius: "0.75rem",
      headerVariant: "split",
      footerVariant: "columns",
    },
  },
  {
    key: "portfolio",
    name: "Portfolio",
    category: "Personal",
    preview: "/themes/portfolio.svg",
    config: {
      colors: {
        primary: "#111111",
        secondary: "#737373",
        accent: "#ef4444",
        background: "#fafafa",
        surface: "#ffffff",
        text: "#111111",
        muted: "#737373",
      },
      fonts: font("Playfair Display", "Inter"),
      radius: "0.25rem",
      headerVariant: "centered",
      footerVariant: "simple",
    },
  },
  {
    key: "restaurant",
    name: "Restaurant",
    category: "Food",
    preview: "/themes/restaurant.svg",
    config: {
      colors: {
        primary: "#9a3412",
        secondary: "#1c1917",
        accent: "#ea580c",
        background: "#fffbeb",
        surface: "#fef3c7",
        text: "#1c1917",
        muted: "#78716c",
      },
      fonts: font("Playfair Display", "Lato"),
      radius: "0.5rem",
      headerVariant: "centered",
      footerVariant: "simple",
    },
  },
  {
    key: "education",
    name: "Education",
    category: "Learning",
    preview: "/themes/education.svg",
    config: {
      colors: {
        primary: "#0e7490",
        secondary: "#0f766e",
        accent: "#06b6d4",
        background: "#ffffff",
        surface: "#ecfeff",
        text: "#0f172a",
        muted: "#64748b",
      },
      fonts: font("Poppins", "Inter"),
      radius: "0.75rem",
      headerVariant: "split",
      footerVariant: "columns",
    },
  },
  {
    key: "medical",
    name: "Medical",
    category: "Healthcare",
    preview: "/themes/medical.svg",
    config: {
      colors: {
        primary: "#0891b2",
        secondary: "#0369a1",
        accent: "#22d3ee",
        background: "#ffffff",
        surface: "#f0f9ff",
        text: "#0c4a6e",
        muted: "#64748b",
      },
      fonts: font("Inter", "Inter"),
      radius: "0.5rem",
      headerVariant: "split",
      footerVariant: "columns",
    },
  },
  {
    key: "real-estate",
    name: "Real Estate",
    category: "Property",
    preview: "/themes/real-estate.svg",
    config: {
      colors: {
        primary: "#1e3a8a",
        secondary: "#b45309",
        accent: "#d97706",
        background: "#ffffff",
        surface: "#f8fafc",
        text: "#1e293b",
        muted: "#64748b",
      },
      fonts: font("Montserrat", "Inter"),
      radius: "0.375rem",
      headerVariant: "split",
      footerVariant: "columns",
    },
  },
  {
    key: "ecommerce",
    name: "Ecommerce",
    category: "Retail",
    preview: "/themes/ecommerce.svg",
    config: {
      colors: {
        primary: "#db2777",
        secondary: "#1f2937",
        accent: "#ec4899",
        background: "#ffffff",
        surface: "#fdf2f8",
        text: "#111827",
        muted: "#6b7280",
      },
      fonts: font("Poppins", "Inter"),
      radius: "0.75rem",
      headerVariant: "split",
      footerVariant: "columns",
    },
  },
  {
    key: "landing",
    name: "Landing Page",
    category: "Marketing",
    preview: "/themes/landing.svg",
    config: {
      colors: {
        primary: "#16a34a",
        secondary: "#15803d",
        accent: "#22c55e",
        background: "#ffffff",
        surface: "#f0fdf4",
        text: "#14532d",
        muted: "#6b7280",
      },
      fonts: font("Inter", "Inter"),
      radius: "1rem",
      headerVariant: "minimal",
      footerVariant: "simple",
    },
  },
];

export const DEFAULT_THEME_KEY = "business";
