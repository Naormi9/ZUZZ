import { brandPalette } from './brand-tokens';

/**
 * ZUZZ Tailwind Preset
 *
 * Shared brand colors, semantic tokens, and font configuration.
 * Import this in both apps/web and apps/admin tailwind configs.
 */
const zuzzPreset = {
  theme: {
    extend: {
      colors: {
        ...brandPalette,
      },
      fontFamily: {
        sans: ['var(--font-heebo)', 'Heebo', 'Arial', 'sans-serif'],
      },
    },
  },
};

export default zuzzPreset;
