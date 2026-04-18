import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        bg: {
          primary: "#080D1A",
          secondary: "#0E1628",
          card: "#111C33",
          hover: "#162040",
          border: "#1A2744",
        },
        accent: {
          cyan: "#00D9FF",
          green: "#00E5A0",
          amber: "#F59E0B",
          red: "#EF4444",
        },
        text: {
          primary: "#E8EDF5",
          secondary: "#7A8FB0",
          muted: "#3D5080",
        },
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      backgroundImage: {
        "gradient-card":
          "linear-gradient(135deg, #111C33 0%, #0E1628 100%)",
        "gradient-accent":
          "linear-gradient(135deg, #00D9FF22 0%, #00E5A022 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
