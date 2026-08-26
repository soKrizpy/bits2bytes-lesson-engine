import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
        },
        secondary: "#38bdf8",
        success: "#10b981",
        warning: "#f59e0b",
        challenge: "#f97316",
        error: "#f43f5e",
        xpGold: "#fbbf24",
        background: "#0f172a",
        card: "#1e293b",
        surface: "#172338",
        elevated: "#24324a",
        border: "#334155",
        focus: "#a5b4fc",
        "text-base": "#f8fafc",
        "text-muted": "#94a3b8",
      },
      transitionDuration: {
        micro: "200ms",
        transition: "300ms",
        celebration: "500ms",
      },
      animation: {
        "xp-gain": "xpGain 2s ease-out forwards",
        "node-complete": "nodeComplete 300ms ease-out forwards",
        celebration: "celebration 500ms ease-out forwards",
        "rope-reveal": "ropeReveal 400ms ease-out forwards",
        "ring-pulse": "ringPulse 2s ease-in-out infinite",
      },
      keyframes: {
        xpGain: {
          "0%": { opacity: "0", transform: "translateY(0)" },
          "20%": { opacity: "1" },
          "80%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-40px)" },
        },
        nodeComplete: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        celebration: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        ropeReveal: {
          "0%": { transform: "scaleY(0)", opacity: "0" },
          "60%": { opacity: "1" },
          "100%": { transform: "scaleY(1)", opacity: "1" },
        },
        ringPulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.08)" },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
