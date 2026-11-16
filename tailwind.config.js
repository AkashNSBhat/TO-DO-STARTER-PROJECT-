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
        // Deep obsidian & elevated charcoal tokens (PROJECT.md R1 / Interface Contract 1)
        charcoal: {
          950: "#0d0f12", // Deep obsidian background
          900: "#121417", // Primary app background
          850: "#16191e", // Intermediate elevated tile / status pill
          800: "#1a1e24", // Elevated card container 1
          700: "#222730", // Elevated card container 2 / hover
          600: "#2b323d", // Subtle hairline border
          500: "#475569", // Border active / secondary text border
        },
        // Accent tokens (PROJECT.md R1 / Interface Contract 1)
        accent: {
          teal: "#14b8a6",    // Primary teal accent
          emerald: "#10b981", // Completed checks & active indicators
          violet: "#8b5cf6",  // Entertainment tags
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
          50: "#f0fdf9",
          100: "#ccfbef",
          200: "#99f6e0",
          300: "#5eead0",
          400: "#2dd4b9",
          500: "#14b8a6", // Primary Accent
          600: "#0d9488",
          700: "#0f7669",
          800: "#115e54",
          900: "#134e46",
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
