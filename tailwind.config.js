/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Modern Figma-inspired deep surfaces & elevations
        charcoal: {
          950: "#0e1013", // Ultra-deep background
          900: "#131518", // App canvas background
          850: "#16181d", // Icon rail / deep sidebar
          800: "#1b1d22", // Contextual drawer / panel
          750: "#21242b", // Card container surface
          700: "#282c35", // Card hover / elevated surface
          600: "#2e323d", // Card & divider borders
          500: "#454b5b", // Border active / muted text
        },
        // Modern Royal Blue & Figma Palette
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#4f6bf7",
          600: "#3b66ff", // Primary brand button & active state
          700: "#2b54e6",
          800: "#1e42d0",
          900: "#1530a6",
        },
        // Progress & Status Accents
        tangerine: {
          400: "#fb923c",
          500: "#ff783e", // In-progress orange bar
          600: "#ea580c",
        },
        lime: {
          400: "#4ade80",
          500: "#22c55e", // Completed green bar
          600: "#16a34a",
        },
        // Backward-compatible semantic accent mapping
        accent: {
          teal: "#3b66ff",    // Primary accent switched to Royal Blue
          blue: "#3b66ff",    // Electric Royal Blue
          orange: "#ff783e",  // Warm Tangerine In-Progress
          emerald: "#22c55e", // Neon Emerald Done
          violet: "#6366f1",  // Media & horizon tags
          amber: "#f59e0b",   // Streaks & priority flags
        },
        // Semantic CSS-variable-backed color bridges
        theme: {
          bg: "var(--bg-primary)",
          card: "var(--bg-secondary)",
          elevated: "var(--bg-tertiary)",
          border: "var(--border-subtle)",
          text: "var(--text-primary)",
          muted: "var(--text-secondary)",
        },
        // Backward-compatibility alias for sage
        sage: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#3b66ff", // Primary Accent
          600: "#2b54e6",
          700: "#1e42d0",
          800: "#1530a6",
          900: "#0f2278",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"Cascadia Code"',
          '"Segoe UI Mono"',
          "Consolas",
          '"Courier New"',
          "monospace",
        ],
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)",
        "dropdown": "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)",
      },
      borderRadius: {
        "pill": "9999px",
      },
    },
  },
  plugins: [],
};
