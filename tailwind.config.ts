import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#050d05',
          2: '#0a180a',
        },
        accent: {
          DEFAULT: '#a8ff3e',
          d: 'rgba(168,255,62,0.12)',
          g: 'rgba(168,255,62,0.35)',
        },
        furbito: {
          red: '#ff5c5c',
          orange: '#ff9030',
          gold: '#ffd700',
          muted: 'rgba(240,240,240,0.55)',
          border: 'rgba(255,255,255,0.08)',
          'border-a': 'rgba(168,255,62,0.22)',
          card: 'rgba(255,255,255,0.045)',
          'card-2': 'rgba(255,255,255,0.07)',
        },
      },
      fontFamily: {
        bebas: ['"Bebas Neue"', 'cursive'],
        barlow: ['"Barlow"', 'sans-serif'],
      },
      borderRadius: {
        s: '10px',
        m: '14px',
        l: '20px',
      },
      maxWidth: {
        app: '500px',
      },
      height: {
        nav: '72px',
        header: '56px',
      },
    },
  },
  plugins: [],
}

export default config
