---
name: StockSense Merchant Lite
colors:
  surface: '#111316'
  surface-dim: '#111316'
  surface-bright: '#37393d'
  surface-container-lowest: '#0c0e11'
  surface-container-low: '#1a1c1f'
  surface-container: '#1e2023'
  surface-container-high: '#282a2d'
  surface-container-highest: '#333538'
  on-surface: '#e2e2e6'
  on-surface-variant: '#e3beb7'
  inverse-surface: '#e2e2e6'
  inverse-on-surface: '#2f3034'
  outline: '#aa8982'
  outline-variant: '#5b403b'
  surface-tint: '#ffb4a5'
  primary: '#ffb4a5'
  on-primary: '#640c00'
  primary-container: '#fc593a'
  on-primary-container: '#580900'
  inverse-primary: '#b5260b'
  secondary: '#6bd8cb'
  on-secondary: '#003732'
  secondary-container: '#29a195'
  on-secondary-container: '#00302b'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a5'
  on-primary-fixed: '#3e0400'
  on-primary-fixed-variant: '#8e1500'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#111316'
  on-background: '#e2e2e6'
  surface-variant: '#333538'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-tablet: 1rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-tablet: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The design system balances high-efficiency commerce tooling with approachable, human-centered SaaS clarity. Crafted for boutique store owners, independent makers, and growing DTC merchants, the aesthetic abandons cold enterprise jargon and sterile surveillance-style density in favor of warm confidence, legibility, and effortless tactical control.

The visual style combines **Modern Minimal Dark Mode** with **Refined Tactile Accents**. It relies on deep obsidian canvases, subtle warm-gray surface stepping, clean 1px structural framing, and a vibrant energetic coral highlight. The UI evokes reliability, operational lightness, and total operational mastery without cognitive fatigue during extended floor shifts, warehouse sorting, or POS counter audits.

## Colors
The palette is structured to deliver immediate visual hierarchy across dense inventory metrics while preserving eye comfort under warehouse or shop counter lighting.

- **Primary (`#F95738`)**: Warm Solar Coral. Used for high-intent actions, primary triggers (e.g., "Add Stock", "Fulfill Order"), active filters, and critical stock depletion alerts.
- **Secondary (`#0D9488`)**: Balanced Spruce Teal. Used for healthy operational states, confirmed arrivals ("Received"), positive stock reconciliations, and inventory restock growth indicators.
- **Tertiary (`#F59E0B`)**: Amber Harvest. Allocated for warnings, "Pending" fulfillment statuses, and time-sensitive backorders.
- **Neutral (`#121417`)**: Pitch Obsidian Base. Grounded by tiered contextual surface elevations:
  - Canvas Base: `#0B0D0F`
  - Layer 1 Cards & Panels: `#121417`
  - Layer 2 Nested Rows & Elevated Modals: `#1A1D21`
  - Borders & Dividers: `#272B30`
  - Text Primary: `#F3F4F6`
  - Text Muted/Secondary: `#9CA3AF`

## Typography
The system employs a tri-font structure designed to partition narrative identity, tabular utility, and systemic metadata:

- **Outfit (Headlines & Page Sections)**: Provides an open, geometric, and modern boutique feel that removes the cold corporate edge.
- **Inter (Body, Descriptions, Form Controls)**: Chosen for unmatched screen legibility, neutral neutral grotesque rhythm, and bulletproof micro-text rendering at POS resolutions.
- **Space Grotesk (Labels, Badges, SKUs, and Status Tags)**: Delivers a crisp, monoline technical snap to inventory counts, barcodes, order numbers, and category pills without looking overly industrial.

## Layout & Spacing
The layout uses a 12-column fluid grid system on desktop (`min-width: 1024px`), transforming to an 8-column layout on tablet/POS terminals (`768px - 1023px`), and a single or 2-column stacked fluid layout for mobile screens (`< 768px`).

- **Grid Alignment**: Core operational cards (e.g., Quick Stats, Low Stock Banners) span either 3 or 4 columns on desktop, 4 columns on tablet, and full width on mobile.
- **Breathing Room**: Inventory dashboards inherently risk density fatigue. Elements must maintain generous internal clearance (`space-lg` card paddings) to prevent misclicks on touch-enabled registers.
- **Reflow Rules**: Data tables gracefully transition into structured list cards on mobile, hiding auxiliary telemetry (e.g., supplier tax IDs) while maintaining actionable primary indicators (SKU, on-hand count, reorder triggers).

## Elevation & Depth
Elevation is constructed via **tonal layering combined with low-contrast structural borders**, completely eschewing heavy drop shadows that muddy dark themes.

- **Level 0 (Canvas)**: Raw dark background (`#0B0D0F`), non-interactive.
- **Level 1 (Card & Module Layer)**: Surface color `#121417` framed by a 1px border (`#272B30`). Used for standard cards, inventory rows, and KPI widgets.
- **Level 2 (Active & Floating Components)**: Surface color `#1A1D21` with a soft ambient shadow (`0 8px 24px -4px rgba(0, 0, 0, 0.45)`) and border `#373C44`. Used for dropdowns, popover detail sheets, quick-action drawers, and filter bars.
- **Level 3 (Modal Overlay)**: Surface color `#1F2329` with border `#444A54` and a high-blur backdrop scrim (`backdrop-filter: blur(8px); background: rgba(11, 13, 15, 0.75)`).
- **Interactive Focus & Hover**: Hovered items do not pop forward dramatically; they brighten their border to `#F95738` (at 40% alpha) and lift background lightness by 3%.

## Shapes
The shape language is contemporary, friendly, and structured. A baseline corner radius of `0.5rem` (8px) ensures that UI elements feel inviting rather than clinical.

- **Cards and Containers**: `rounded-lg` (16px) creates generous soft corners that visually encapsulate distinct merchant domains (e.g., Orders to Ship, Stock Inflow).
- **Interactive Controls (Inputs, Buttons)**: `rounded` (8px) delivers a crisp, touch-friendly target with reliable tap affordance.
- **Badges, Tags, and Status Pills**: Pill-shaped (`9999px`) to immediately distinguish passive metadata and state flags from square-cornered actionable cards.

## Components

### Buttons
- **Primary**: Solid Coral `#F95738` fill, `#FFFFFF` text, `font-family: Outfit`, semi-bold (600), 8px border radius. Subtle hover transition to `#E04324`. Focused with a 2px Coral outline ring offset by 2px obsidian canvas.
- **Secondary**: Surface `#1A1D21` with 1px border `#272B30`, `#F3F4F6` text. Hover adds 1px border `#F95738` and text color shift to `#F95738`.
- **Ghost/Tertiary**: Transparent fill, `#9CA3AF` text, padding aligned with text bounds for contextual actions like "Cancel" or "View Receipt".

### Status Tags & Chips
Set in `Space Grotesk` (12px, medium) inside full-pill containers:
- **Low Stock**: `#F95738` tint background (12% opacity), `#F95738` text, subtle 1px border at 25% opacity.
- **Received / In Stock**: `#0D9488` tint background (12% opacity), `#2DD4BF` text, 1px teal border at 25% opacity.
- **Pending / In Transit**: `#F59E0B` tint background (12% opacity), `#FBBF24` text, 1px amber border at 25% opacity.
- **Shipped**: Subtle blue-gray tint background (15% opacity), `#93C5FD` text.

### Cards
- Constructed with `#121417` background, 16px corner radius (`rounded-lg`), 1px `#272B30` border, and `space-lg` internal padding.
- Card header zones clearly distinguish the merchant metric name (`title-md` in Inter) from quantitative inventory counts (`display-lg` in Outfit).

### Inventory Progress Bars
- Linear bars indicating stock threshold health. Height: 6px, radius: 9999px.
- Background track: `#1A1D21`. Active fill: dynamic color mapping to green (`#0D9488`) above 40% capacity, yellow (`#F59E0B`) between 15%-40%, and coral (`#F95738`) under 15% with an animated pulse on critical depletion.

### Input Fields & Search Bars
- Background `#0B0D0F`, 1px border `#272B30`, text `#F3F4F6`, placeholder `#6B7280`, radius 8px.
- Focus state switches border directly to `#F95738` with an ambient glow (`box-shadow: 0 0 0 3px rgba(249, 87, 56, 0.15)`).
- Search fields feature integrated barcode icon triggers for mobile/tablet inventory scanning.

### Lists & Row Items
- Alternate zebra striping is discarded in favor of thin 1px `#1E2227` horizontal dividers and generous padding (`space-md` top/bottom). Hovering a row initiates a smooth `#16191E` surface transition with visible right-aligned quick actions ("Adjust Count", "Print Label").