# StockSense — Intelligent Inventory Management System (IMS)

An enterprise-grade, standalone Inventory Management System (IMS) crafted with React, TypeScript, Tailwind CSS, TanStack Query, and an in-browser local storage engine with atomic transaction validation.

---

## Highlights

- **Zero Backend Dependency**: Runs entirely in the client with a persistent in-browser storage layer (`mockDb`). No external servers, Docker containers, or database instances required.
- **Enterprise UI / UX**: Modern dark/light theme support, glassmorphism cards, glowing status badges, Command Palette (`Ctrl+K` / `⌘K`), multi-warehouse switcher, and quick-action shortcuts.
- **Atomic Operations**:
  - **Inbound Receipts**: Dynamic multi-line supplier shipments with validation workflow (`Draft` ➔ `Waiting` ➔ `Ready` ➔ `Done`) and stock crediting.
  - **Outbound Deliveries**: Real-time warehouse stock availability checks, customer order fulfillment, and automated inventory deduction.
  - **Internal Transfers**: Visual inter-facility routing (`Source Hub` ➔ `Destination Hub`) with location-level stock balance updates.
  - **Stock Adjustments / Audits**: Cycle count discrepancy reconciliation (Physical Count vs. System Count) with automatic variance calculation and shrinkage tracking.
- **Immutable Ledger Audit Trail**: Full transaction history logging every single inbound, outbound, transfer, and adjustment event.
- **Executive Dashboard**: Real-time KPIs (Total Inventory Valuation, Active SKUs, Low Stock alerts, Inbound/Outbound Queues), 30-day movement area charts, category distribution, and facility breakdown.
- **Data Export & Portability**: 1-click CSV exports for product catalogs and audit ledgers, plus complete JSON backup and 1-click demo data reset.

---

## Tech Stack

- **Framework:** React 19, Vite, TypeScript
- **Styling:** Tailwind CSS v3, Custom Design System (HSL tokens, Glassmorphism, Dark/Light modes)
- **State & Query:** Zustand (Auth & Theme state), TanStack Query (Client-side async state caching)
- **Forms & Validation:** React Hook Form, Zod
- **Visualizations:** Recharts (30-day interactive area charts, category progress bars)
- **Icons & Effects:** Lucide React, Canvas Confetti, React Hot Toast

---

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install --workspace=frontend
   ```

2. **Launch Dev Server**:
   ```bash
   npm run dev
   ```

3. **Open Application**:
   Navigate to `http://localhost:5173` in your browser.

4. **Demo Credentials**:
   - Use the **"Instant 1-Click Demo Login"** button on the sign-in page, or:
   - **Email:** `demo@stocksense.app`
   - **Password:** `Demo@1234`
   *(Or sign up with any new account — it will automatically create and persist your profile!)*

---

## Keyboard Shortcuts

- `Ctrl + K` or `⌘ + K`: Open Command Palette to instantly jump to any page, action, or SKU.
- `ESC`: Close active modal, drawer, or command palette.
