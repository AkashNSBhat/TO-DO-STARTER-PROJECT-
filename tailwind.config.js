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
        charcoal: {
          950: "#0d0f12",
          900: "#121417", // Primary background
          850: "#16191e",
          800: "#1a1e23", // Card / Secondary background
          700: "#242930", // Elevated / Hover background
          600: "#2d343f", // Border subtle
          500: "#475569", // Border active
        },
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
    },
  },
  plugins: [],
}
