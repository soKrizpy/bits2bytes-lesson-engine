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
        success: "#10b981",
        warning: "#f59e0b",
        error: "#f43f5e",
        xpGold: "#fbbf24",
        background: "#0f172a",
        card: "#1e293b",
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
