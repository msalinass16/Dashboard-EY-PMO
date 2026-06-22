/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#06090f',
          secondary: '#0d1220',
          card: '#0f1823',
          hover: '#15202e',
          elevated: '#1a2840',
        },
        surface: {
          DEFAULT: '#0f1823',
          raised: '#15202e',
          overlay: '#1c2d42',
        },
        border: {
          DEFAULT: '#1a2d42',
          bright: '#243d5c',
          subtle: '#111f2e',
        },
        gain: {
          DEFAULT: '#22c55e',
          muted: '#16a34a',
          dim: '#052e16',
        },
        loss: {
          DEFAULT: '#ef4444',
          muted: '#dc2626',
          dim: '#450a0a',
        },
        accent: {
          DEFAULT: '#38bdf8',
          bright: '#7dd3fc',
          dim: '#0369a1',
          muted: '#0c4a6e',
        },
        gold: {
          DEFAULT: '#f59e0b',
          dim: '#78350f',
        },
        purple: {
          DEFAULT: '#a855f7',
          dim: '#581c87',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
