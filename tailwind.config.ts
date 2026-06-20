import type { Config } from "tailwindcss";

/**
 * Demashki ERP — Tailwind CSS Configuration
 *
 * NOTE: This project uses Tailwind CSS v4, which reads theme configuration
 * primarily from the `@theme` block in `globals.css`. This config file is
 * provided as a supplementary/compatibility layer. If you import it via
 * `@config "./tailwind.config.ts"` in your CSS, these values will merge
 * with the @theme block.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Primary ── */
        primary: "var(--primary)",
        "primary-container": "var(--primary-container)",
        "on-primary": "var(--on-primary)",
        "on-primary-container": "var(--on-primary-container)",
        "primary-fixed": "var(--primary-fixed)",
        "primary-fixed-dim": "var(--primary-fixed-dim)",
        "on-primary-fixed": "var(--on-primary-fixed)",
        "on-primary-fixed-variant": "var(--on-primary-fixed-variant)",

        /* ── Secondary ── */
        secondary: "var(--secondary)",
        "secondary-container": "var(--secondary-container)",
        "on-secondary": "var(--on-secondary)",
        "on-secondary-container": "var(--on-secondary-container)",
        "secondary-fixed": "var(--secondary-fixed)",
        "secondary-fixed-dim": "var(--secondary-fixed-dim)",
        "on-secondary-fixed": "var(--on-secondary-fixed)",
        "on-secondary-fixed-variant": "var(--on-secondary-fixed-variant)",

        /* ── Tertiary ── */
        tertiary: "var(--tertiary)",
        "tertiary-container": "var(--tertiary-container)",
        "on-tertiary": "var(--on-tertiary)",
        "on-tertiary-container": "var(--on-tertiary-container)",
        "tertiary-fixed": "var(--tertiary-fixed)",
        "tertiary-fixed-dim": "var(--tertiary-fixed-dim)",
        "on-tertiary-fixed": "var(--on-tertiary-fixed)",
        "on-tertiary-fixed-variant": "var(--on-tertiary-fixed-variant)",

        /* ── Error ── */
        error: "var(--error)",
        "error-container": "var(--error-container)",
        "on-error": "var(--on-error)",
        "on-error-container": "var(--on-error-container)",

        /* ── Surface / Background ── */
        surface: "var(--surface)",
        "surface-dim": "var(--surface-dim)",
        "surface-bright": "var(--surface-bright)",
        "surface-container-lowest": "var(--surface-container-lowest)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container": "var(--surface-container)",
        "surface-container-high": "var(--surface-container-high)",
        "surface-container-highest": "var(--surface-container-highest)",
        "surface-variant": "var(--surface-variant)",
        "surface-tint": "var(--surface-tint)",
        "on-surface": "var(--on-surface)",
        "on-surface-variant": "var(--on-surface-variant)",
        background: "var(--background)",
        "on-background": "var(--on-background)",

        /* ── Outline ── */
        outline: "var(--outline)",
        "outline-variant": "var(--outline-variant)",

        /* ── Inverse ── */
        "inverse-surface": "var(--inverse-surface)",
        "inverse-on-surface": "var(--inverse-on-surface)",
        "inverse-primary": "var(--inverse-primary)",
      },

      fontFamily: {
        "display-lg": ["Tajawal", "Plus Jakarta Sans", "sans-serif"],
        "display-lg-mobile": ["Tajawal", "Plus Jakarta Sans", "sans-serif"],
        "headline-md": ["Tajawal", "Plus Jakarta Sans", "sans-serif"],
        "body-lg": ["Tajawal", "Plus Jakarta Sans", "sans-serif"],
        "body-md": ["Tajawal", "Plus Jakarta Sans", "sans-serif"],
        "label-sm": ["Tajawal", "Plus Jakarta Sans", "sans-serif"],
      },

      borderRadius: {
        sm: "0.125rem",
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },

      spacing: {
        "margin-mobile": "16px",
        gutter: "24px",
        "margin-desktop": "40px",
        base: "8px",
        "container-max": "1280px",
      },

      maxWidth: {
        "container-max": "1280px",
      },

      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.92)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "scale-in": "scaleIn 0.3s ease-out forwards",
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [],
};

export default config;
