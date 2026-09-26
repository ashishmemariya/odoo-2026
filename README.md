# StockSense

A production-quality Inventory Management System (IMS) built with the MERN stack (MongoDB, Express, React, Node.js) and Tailwind CSS + shadcn/ui.

## Features

- **Authentication**: JWT-based auth, Signup, Login, Password Reset, and secure route guards.
- **Dashboard**: Real-time KPI aggregation and a 30-day stock movement trend chart using Recharts.
- **Operations**: End-to-end stock mutation logic ensuring atomic transactions for:
  - Receipts (Inbound)
  - Delivery Orders (Outbound) - includes insufficient stock validation
  - Internal Transfers (Warehouse to Warehouse)
  - Inventory Adjustments
- **Ledger/Audit**: Complete immutable `StockLedger` tracking every single product movement.
- **Seeding**: Automatically seeds a MongoDB memory server on the first launch with Warehouses, Products, and dozens of pre-validated operations to instantly populate the dashboard.

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS v3, Zustand (Auth state), TanStack Query (Server state), Recharts, React Hook Form + Zod.
- **Backend:** Node.js, Express, TypeScript, Mongoose.
- **Database:** MongoDB (Memory server for zero-setup local dev).

## Getting Started

1. Install all dependencies from the root directory:
   ```bash
   npm install
   ```

2. Run the application (starts both frontend and backend concurrently):
   ```bash
   npm run dev --workspaces
   ```

3. Open your browser to `http://localhost:5173`.
4. Log in with the auto-generated demo credentials:
   - **Email:** `demo@stocksense.app`
   - **Password:** `Demo@1234`
