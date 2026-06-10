import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#1a6b3c",
          earth: "#7c5c2e",
          sky: "#1e4d8c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
