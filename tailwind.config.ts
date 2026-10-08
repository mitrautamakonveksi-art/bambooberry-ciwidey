import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

const config = {
  darkMode: ["class", '[class~="dark"]'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2A7C13", 
          foreground: "#ffffff",
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config

export default config
