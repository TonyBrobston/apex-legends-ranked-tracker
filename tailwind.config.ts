import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        rank: {
          bronze: "#a5673f",
          silver: "#9aa5ad",
          gold: "#d4af37",
          platinum: "#3fa9a0",
          diamond: "#5b8def",
          master: "#8e44ad",
          apex: "#c0392b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
