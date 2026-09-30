/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        grotesk: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        burgundy: {
          DEFAULT: '#7E454B',
          hover: '#6A393E',
          active: '#582E33',
          light: '#94535A',
          subtle: 'rgba(126, 69, 75, 0.12)',
        },
        warm: {
          bg: '#F6F4F0',
          card: '#FFFFFF',
          panel: '#EFECE6',
          border: '#E5E0D8',
          text: '#2B2827',
          muted: '#6E6966',
        },
        console: {
          bg: '#121114',
          card: '#19181C',
          panel: '#222026',
          border: '#29262C',
          text: '#F0EDEA',
          muted: '#9E9793',
        }
      }
    },
  },
  plugins: [],
}

