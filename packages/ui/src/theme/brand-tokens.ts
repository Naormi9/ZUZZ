/**
 * ZUZZ Brand Tokens
 *
 * Approved brand palette — do not modify without design approval.
 *
 * brand-black:    #1B1B1B
 * brand-charcoal: #323232
 * brand-cream:    #FFE7D0
 * brand-orange:   #FC6E20
 */

export const brandTokens = {
  black: '#1B1B1B',
  charcoal: '#323232',
  cream: '#FFE7D0',
  orange: '#FC6E20',
} as const;

/**
 * Extended brand palette — derived shades for UI usage.
 * Generated to maintain visual harmony with the core brand colors.
 */
export const brandPalette = {
  brand: {
    50: '#FFF4EB',
    100: '#FFE4CC',
    200: '#FFCFA3',
    300: '#FFB370',
    400: '#FF9040',
    500: '#FC6E20', // brand-orange — primary
    600: '#E55A0D',
    700: '#C04A0A',
    800: '#993D0F',
    900: '#7D3410',
    950: '#441706',
  },
  'brand-black': '#1B1B1B',
  'brand-charcoal': '#323232',
  'brand-cream': '#FFE7D0',
} as const;
