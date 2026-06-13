/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        surface: {
          DEFAULT:   "#ffffff",
          secondary: "#f8fafc",
          tertiary:  "#f1f5f9",
        },
        sidebar: {
          DEFAULT: "#09090b",
          surface: "#18181b",
          hover:   "#27272a",
          border:  "#3f3f46",
          muted:   "#71717a",
          text:    "#a1a1aa",
          active:  "#a5b4fc",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card:    "0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-md": "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.04)",
        "card-lg": "0 10px 24px -4px rgba(0,0,0,0.09), 0 4px 8px -4px rgba(0,0,0,0.04)",
        brand:   "0 0 0 3px rgba(99,102,241,0.18)",
        glow:    "0 0 24px rgba(99,102,241,0.25)",
      },
      animation: {
        "fade-in":  "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:   { from: { opacity: "0" },                                         to: { opacity: "1" } },
        slideUp:  { from: { opacity: "0", transform: "translateY(6px)" },           to: { opacity: "1", transform: "translateY(0)" } },
        pulseDot: { "0%,100%": { opacity: "1", transform: "scale(1)" },             "50%": { opacity: "0.5", transform: "scale(0.85)" } },
      },
      backgroundImage: {
        "brand-gradient":  "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        "dark-panel":      "linear-gradient(160deg, #09090b 0%, #0d0d1a 50%, #09090b 100%)",
        "sidebar-gradient":"linear-gradient(180deg, #09090b 0%, #0f0f14 100%)",
      },
    },
  },
  plugins: [],
};
