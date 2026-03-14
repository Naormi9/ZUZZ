# ZUZZ Brand & Theme System

## Brand Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-black` | `#1B1B1B` | Primary text, dark backgrounds |
| `brand-charcoal` | `#323232` | Secondary text, dark gradients |
| `brand-cream` | `#FFE7D0` | Accent backgrounds, hero text on dark |
| `brand-orange` | `#FC6E20` | Primary action color, brand accent |

The orange palette has a full scale from `brand-50` (#FFF4EB) to `brand-950` (#441706), defined in `packages/ui/src/theme/brand-tokens.ts`.

## Architecture

```
packages/ui/src/theme/
├── brand-tokens.ts      # Core color values + palette scale
├── tailwind-preset.ts   # Shared Tailwind preset (colors, fonts)
├── semantic-tokens.css  # CSS custom properties for semantic roles
└── index.ts             # Barrel export
```

### How it flows

1. `brand-tokens.ts` defines the source-of-truth hex values
2. `tailwind-preset.ts` imports those values into a Tailwind preset
3. Both `apps/web` and `apps/admin` use the preset in their `tailwind.config.ts`
4. `semantic-tokens.css` maps brand tokens to CSS custom properties for semantic use
5. Both apps import the semantic CSS in their `globals.css`

## Usage in Components

Use Tailwind brand classes directly:

```tsx
// Buttons, CTAs
<button className="bg-brand-500 hover:bg-brand-600 text-white">

// Text on white backgrounds (large/bold text, icons)
<span className="text-brand-500 font-bold text-xl">

// Small text links (use brand-700 for AA contrast)
<a className="text-brand-700 hover:text-brand-800 text-sm">

// Dark backgrounds
<div className="bg-brand-black text-brand-cream">

// Subtle backgrounds
<div className="bg-brand-50 text-brand-800">
```

## Contrast Safety

On white (`#FFFFFF`):

| Color | Ratio | WCAG AA | Use for |
|-------|-------|---------|---------|
| `brand-500` (#FC6E20) | 3.0:1 | Large text only | Buttons (bold 14px+), icons, decorative |
| `brand-600` (#E55A0D) | 3.7:1 | Large text only | Hover states |
| `brand-700` (#C04A0A) | 5.0:1 | Normal text | Small text links, body text |
| `brand-black` (#1B1B1B) | 17.6:1 | AAA | Primary body text |
| `brand-charcoal` (#323232) | 12.6:1 | AAA | Secondary body text |

**Rule**: Never use `brand-500` for `text-sm` or smaller text on white backgrounds. Use `brand-700` or darker.

## Logo Assets

```
apps/web/public/brand/
├── logo-mark.svg    # Primary logo (ZU dark + ZZ orange)
├── logo-full.svg    # Logo with tagline
├── logo-dark.svg    # Light variant for dark backgrounds
└── favicon.svg      # Square favicon (dark bg, orange Z)
```

Admin app has copies in `apps/admin/public/brand/`.

## Adding New Brand Colors

1. Add hex values to `packages/ui/src/theme/brand-tokens.ts`
2. Update `tailwind-preset.ts` if adding to Tailwind
3. Add semantic mappings to `semantic-tokens.css` if needed
4. Verify contrast ratios before using on white/light backgrounds
5. Update this doc
