---
name: StockSense Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: -0.01em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-lg: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system drives an industrial-grade warehouse inventory operations platform where speed, exactitude, and zero-latency scanning are paramount. The visual language bridges industrial operational rigor with contemporary SaaS precision. It communicates absolute reliability, operational velocity, and audit-level defensibility ("One source of truth for every stock movement").

The aesthetic employs an authoritative Corporate & Modern style fused with dense, high-utility data dashboard mechanics:
- **Structural Atmosphere**: Deep navy and dark slate command surfaces (navbars, shell chrome, sidebars) frame high-legibility crisp light canvases dedicated to analytical workflows and ledger reviews.
- **Visual Tension**: Deliberately minimized decorative flourishes; functional density is prioritized over vast empty padding, avoiding unnecessary vertical expansion.
- **Clarity over Ambiguity**: Strong data boundaries, monospaced tabular data figures, sharp contrasting visual status pills, and high-visibility movement tags that instantly signal stock status across forklift terminals, handheld barcode scanners, and multi-monitor logistics desks.

## Colors

The system uses a hybrid operational palette: an authoritative deep slate shell coupled with a high-contrast, clean work surface. Semantic colors are strictly calibrated to deliver immediate recognition without cognitive load.

### Palette Architecture
- **Chrome & Shell Surfaces (Primary Foundation)**: Deep Slate `#0f172a` (app headers, primary command toolbars) and Slate `#1e293b` (primary navigation panels, rail sidebars, modal headers).
- **Interactive Accent (Secondary)**: Precision Sky Blue `#0284c7` (hover states, focus rings, selected rows, active breadcrumb trails, internal transfer indicators).
- **Semantic Status Signals**:
  - **In Stock / Completed / Validated**: Vivid Emerald `#10b981` (tinted container: `#ecfdf5`, border: `#a7f3d0`).
  - **Low Stock / Pending / Ready**: Vivid Amber `#f59e0b` (tinted container: `#fffbeb`, border: `#fde68a`).
  - **Damaged / Out of Stock / Canceled**: High-contrast Rose `#f43f5e` (tinted container: `#fff1f2`, border: `#fecdd3`).
  - **Draft / Inactive / Quarantined**: Muted Slate `#64748b` (tinted container: `#f8fafc`, border: `#e2e8f0`).
- **Data Tables & Work Surfaces**:
  - Main background: `#f8fafc`
  - Table and card background: `#ffffff`
  - Dividing rules & borders: `#e2e8f0` (default), `#cbd5e1` (interactive inputs / selected rows)
  - Primary text: `#0f172a`
  - Secondary metadata text: `#475569`

## Typography

The typographic hierarchy is designed around dual demands: rapid visual parsing of textual hierarchy and instantaneous verification of dense numeric information (quantities, lot codes, bin numbers, SKUs, and ledger deltas).

- **Primary Typeface**: `Hanken Grotesk` delivers crisp humanist grotesque geometries, providing immediate legibility across interface commands, table cell text, and structural headers without visual fatigue.
- **Data, Code & Metric Typeface**: `JetBrains Mono` handles all inventory metrics, SKU numbers, shelf barcodes, serial codes, timestamps, and ledger balance deltas (`+1,250`, `-45`, `TRF-882`). Tabular figure alignment (`font-variant-numeric: tabular-nums`) must be strictly maintained across all data columns to ensure seamless vertical scanning.
- **Scale Rules**: Headings maintain compact line heights to prevent loose, unmoored vertical spacing in information-dense dashboards. Small labels and badges utilize uppercase or semi-bold monospaced treatments to provide strong visual contrast against regular body copy.

## Layout & Spacing

The layout philosophy is built on high utility, fluid-responsive density optimized for multi-pane logistics management and warehouse floor tablets.

### Grid & Canvas Structure
- **Shell Structure**: Fixed 240px slate-navy sidebar (collapsible to a 56px icon rail for tablet and handheld devices) and a compact 48px global operational utility header.
- **Workspace Layout**: 12-column fluid grid system with `1rem` (16px) gutters on desktop, shrinking to `0.5rem` on mobile terminals. Canvas margins are locked to `1.5rem` on standard resolutions (`>=1024px`) and `1rem` on narrow viewports.
- **Rhythm Principle**: Built around a rigorous 4px baseline rhythm. Component paddings leverage `space-xs` (4px) and `space-sm` (8px) for compact table cells and action triggers; `space-md` (12px) and `space-lg` (16px) are reserved for card housings and structural container padding.
- **Responsive Adaptations**:
  - **Desktop (>=1280px)**: Multi-column split views (e.g., live stock table alongside real-time bin details and transaction drawer).
  - **Tablet (768px - 1279px)**: Side-by-side data grids collapse into stacked full-width modules; secondary metadata columns toggle behind expandable row triggers.
  - **Handheld / Mobile (<768px)**: Fixed bottom utility bar for continuous barcode input; data tables reflow into dense structured summary cards featuring high-visibility directional movement pills.

## Elevation & Depth

This system avoids heavy, atmospheric skeuomorphic shadows or diffuse blurs in favor of structural clarity, low-contrast boundaries, and crisp surface hierarchy. Depth is communicated primarily through distinct tonal surfaces and fine containment rules.

- **Level 0 (Base Canvas)**: `#f8fafc`. The non-interactive background plane against which data surfaces are rendered.
- **Level 1 (Panels, Cards & Tables)**: Pure White `#ffffff` with a crisp `1px solid #e2e8f0` structural border. Shadows are minimal: `0 1px 2px 0 rgba(15, 23, 42, 0.05)`.
- **Level 2 (Dropdowns, Popovers & Floating Actions)**: White `#ffffff` background with `1px solid #cbd5e1` and a focused elevation shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.06)`.
- **Level 3 (Modal Dialogs & Stock Adjustment Drawers)**: `#ffffff` supported by an elevated `0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)` shadow, bounded by `#cbd5e1` and laid over an active scrim `#0f172a` at 45% opacity.
- **Level 4 (Inverted Shell Panels)**: Sidebar and header surfaces occupy a deep `#0f172a` / `#1e293b` tier, creating a dark frame that directs operational focus onto the central light data grid.

## Shapes

The design system employs a disciplined, soft corner treatment (`roundedness: 1`). Industrial software requires structural geometry that maximizes inner screen real estate, maintains sharp grid alignments, and avoids soft, child-like curves.

- **Standard Elements (0.25rem / 4px)**: Default inputs, table cell controls, dropdown select triggers, action buttons, alert banners, and standard data cards.
- **Secondary Containers (0.5rem / 8px)**: High-level dashboard metric cards, slide-out ledger drawers, modal windows, and filter bar shells.
- **Pill Badges & Directional Indicators (`rounded-full` / 9999px)**: Reserved strictly for micro-status indicators, action pills, batch counts, and ledger movement directional tags (`+` inflow, `-` outbound, `⇄` transfer) to clearly differentiate inline data tokens from clickable geometric controls.

## Components

### Buttons & Interactive Controls
- **Primary Action**: Solid `#0f172a` fill, white typography, 4px border radius, 32px height for high density (40px on mobile scanner devices).
- **Secondary Action**: White fill, 1px border `#cbd5e1`, text `#1e293b`. Hover: `#f8fafc`.
- **Action Pills**: Compact 24px-height interactive triggers for immediate table row actions (e.g., "Receive", "Pick", "Split Lot"). Rendered with light slate fills and sharp hover feedback.

### Status Badges & Directional Ledger Tags
- **Status Badges**: 20px height, uppercase `label-sm` font, rounded-full outline. Composed of tinted background, matching solid border, and saturated text:
  - *Done / In Stock*: Emerald background `#ecfdf5`, border `#a7f3d0`, text `#065f46`.
  - *Ready / Waiting / Low Stock*: Amber background `#fffbeb`, border `#fde68a`, text `#92400e`.
  - *Transfer / Internal Move*: Sky background `#f0f9ff`, border `#bae6fd`, text `#0369a1`.
  - *Canceled / Damaged / Zero Stock*: Rose background `#fff1f2`, border `#fecdd3`, text `#9f1239`.
  - *Draft / Idle*: Slate background `#f8fafc`, border `#e2e8f0`, text `#475569`.
- **Ledger Movement Indicators**:
  - Inbound (`+`): Bright emerald text on subtle green tint with leading `+` symbol (`+240 EA`).
  - Outbound (`-`): High-contrast rose text on subtle rose tint with leading `-` symbol (`-12 PLT`).
  - Transfer (`⇄`): Sky blue text with bidirectional iconography (`⇄ BIN-A04 → BIN-C12`).

### High-Density Data Tables
- **Row Architecture**: Fixed heights of 36px (compact view) or 44px (standard view). Cell padding is locked at `space-xs` vertically and `space-sm` horizontally.
- **Header Cells**: 32px height, slate background `#f1f5f9`, border-bottom `2px solid #cbd5e1`, uppercase 11px `label-sm` text with interactive sorting indicators.
- **Tabular Precision**: Numeric quantities, SKUs, and monetary values align right with monospace tabular figures (`JetBrains Mono`). Text descriptions align left. Status indicators and movement tags align center or right.
- **Row States**: Hover state renders `#f8fafc`; selected row highlighted in subtle sky tint `#f0f9ff` with a 2px left border accent in `#0284c7`.

### Breadcrumbs & Location Path Tracing
- Rendered in 12px `label-md` hierarchy. Clear slash or chevron dividers separating operational zones: `Main Warehouse / Aisle 04 / Rack B / Shelf 02 / Bin 14`. Active terminal location is highlighted in semi-bold `#0f172a`.

### Input Fields & Barcode Scanners
- Standard 32px height with crisp `1px solid #cbd5e1` borders.
- Dedicated Barcode / RFID Input variant featuring an active sky blue beacon indicator, monospaced placeholder text, and automatic hotkey indicator (`[F2]` or `[/]`).
- Focus state: `1px solid #0284c7` outline ring with zero blur distance to maintain high visual precision.