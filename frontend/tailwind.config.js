/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        grotesk: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'General Sans', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        paper: {
          DEFAULT: '#F7F7F5',
          card: '#FFFFFF',
          panel: '#EFEFEA',
          subtle: '#E6E6E0',
        },
        forest: {
          DEFAULT: '#1A3C2B',
          hover: '#122C1F',
          light: '#285840',
        },
        coral: {
          DEFAULT: '#FF8C69',
          dark: '#E06B48',
        },
        mint: {
          DEFAULT: '#9EFFBF',
          dark: '#059669',
        },
        gold: {
          DEFAULT: '#F4D35E',
          dark: '#D97706',
        },
        grid: {
          DEFAULT: 'rgba(58, 58, 56, 0.2)',
          subtle: 'rgba(58, 58, 56, 0.08)',
        },
        ink: {
          DEFAULT: '#181816',
          muted: '#5A5A55',
          subtle: '#8C8C85',
        }
      }
    },
  },
  plugins: [],
}
