import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF4EB',
          100: '#FFE4CC',
          200: '#FFCFA3',
          300: '#FFB370',
          400: '#FF9040',
          500: '#FC6E20',
          600: '#E55A0D',
          700: '#C04A0A',
          800: '#993D0F',
          900: '#7D3410',
          950: '#441706',
        },
        'brand-black': '#1B1B1B',
        'brand-charcoal': '#323232',
        'brand-cream': '#FFE7D0',
      },
      fontFamily: {
        sans: ['var(--font-heebo)', 'Heebo', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
