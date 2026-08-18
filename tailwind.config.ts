import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0B0F',
        surface: '#16161D',
        'surface-2': '#1D1D26',
        accent: {
          DEFAULT: '#7C5CFC',
          hover: '#6B4BE8',
        },
        primary: '#F5F5F7',
        secondary: '#9A9AA5',
        danger: '#E5484D',
        border: '#26262F',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
