# StockSense — Enterprise MERN Inventory Management Backend

Production-ready Node.js + Express + MongoDB backend for the StockSense Inventory Management System.

---

## 1. Technology Stack

- **Runtime & Framework:** Node.js (ES Modules), Express.js (v5)
- **Database & ODM:** MongoDB, Mongoose (v8)
- **Authentication & Security:** JWT (`jsonwebtoken`), `bcryptjs`, Helmet, CORS, `express-rate-limit`
- **Validation & Flow:** Custom centralized validation middleware, transactional stock engine

---

## 2. Environment Variables

Create `.env` inside `backend/` (template in `.env.example`):

```ini
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/stocksense

# Client Application URL for CORS
CLIENT_URL=http://localhost:5173

# JWT Authentication
JWT_SECRET=stocksense_dev_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Password Reset OTP
OTP_EXPIRES_MINUTES=10
```

---

## 3. Getting Started

### Installation
From the root directory:
```bash
npm install
```

### Running Backend Server
```bash
npm run dev:backend
```
Or directly from `backend/`:
```bash
npm run dev
```

### Seeding Demo Data
To populate the database with warehouses, locations, categories, products, and default accounts (`demo@stocksense.app` / `Demo@1234`):
```bash
npm run seed --workspace=backend
```

### Running Test Suite
```bash
npm run test --workspace=backend
```

---

## 4. Architecture & Stock Mutation Engine

All inventory updates **must** flow through `stockService.js`. Controllers never modify inventory counts directly.

```
React UI / API Client
      │
      ▼
 Express Route
      │
      ▼
Controller (Request validation & Auth check)
      │
      ▼
Stock Service (stockService.js)
      │
      ├── 1. Verify availability / Prevent negative stock
      ├── 2. Atomically update Inventory (compound index: product + location)
      ├── 3. Recalculate Product totalStock & warehouseStock
      └── 4. Create immutable StockLedger entry
      │
      ▼
Response -> UI update
```

### Lifecycle Operations

1. **Receipts (Inbound):**
   - Flow: `Draft` ➔ `Waiting` / `Ready` ➔ `Validate` (Calls `increaseStock()`) ➔ Status `Done` ➔ Ledger `+qty` (`RECEIPT`).
   - Idempotency: Calling validate repeatedly does not increment stock twice.

2. **Delivery Orders (Outbound):**
   - Flow: `Draft` ➔ `Waiting` ➔ `Ready` ➔ `Validate` (Calls `decreaseStock()`) ➔ Status `Done` ➔ Ledger `-qty` (`DELIVERY`).
   - Insufficient stock validation: Returns HTTP 400 (`"Insufficient stock for product. Available: X, Requested: Y"`). Negative inventory is strictly prevented.

3. **Internal Transfers:**
   - Moves stock from `Source Warehouse/Location` to `Destination Warehouse/Location`.
   - Generates two linked ledger entries: `TRANSFER_OUT` (-qty) and `TRANSFER_IN` (+qty). Total system stock remains invariant.

4. **Physical Stock Adjustments:**
   - Backend calculates: `difference = countedQuantity - recordedQuantity`.
   - Inventory becomes `countedQuantity`. Creates `ADJUSTMENT` ledger entry with computed difference.

---

## 5. API Reference

Base URL: `/api`

### Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register new user. Returns user object and JWT. |
| `POST` | `/api/auth/login` | Public | Authenticate with email/password. Returns JWT. |
| `GET` | `/api/auth/me` | Protected | Returns current authenticated user profile. |
| `PUT` | `/api/auth/profile` | Protected | Updates current user's profile details. |
| `PUT` | `/api/auth/change-password` | Protected | Changes account password. |
| `POST` | `/api/auth/forgot-password` | Public | Generates secure 6-digit OTP and hashes before storage. |
| `POST` | `/api/auth/verify-otp` | Public | Validates OTP hash and expiration. |
| `POST` | `/api/auth/reset-password` | Public | Resets password using verified OTP. |

### Products (`/api/products`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | Protected | List products with search, category, lowStock, and pagination. |
| `GET` | `/api/products/:id` | Protected | Get product details with location stock breakdown. |
| `POST` | `/api/products` | Manager | Create product and optional opening warehouse stock. |
| `PUT` | `/api/products/:id` | Manager | Update product attributes. |
| `DELETE` | `/api/products/:id` | Manager | Deactivate or delete product (soft-deactivates if history exists). |
| `GET` | `/api/products/categories` | Protected | Get list of active product categories. |

### Categories (`/api/categories`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Protected | List categories. |
| `POST` | `/api/categories` | Manager | Create new category. |
| `PUT` | `/api/categories/:id` | Manager | Update category. |
| `DELETE` | `/api/categories/:id` | Manager | Delete category (prevents deletion if active products assigned). |

### Warehouses & Locations (`/api/warehouses`, `/api/locations`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/warehouses` | Protected | List all warehouses and embedded locations. |
| `POST` | `/api/warehouses` | Manager | Create warehouse. |
| `PUT` | `/api/warehouses/:id` | Manager | Update warehouse. |
| `DELETE` | `/api/warehouses/:id` | Manager | Delete warehouse (rejects if inventory exists). |
| `GET` | `/api/locations` | Protected | List standalone locations (supports `?warehouse=<id>`). |

### Receipts (`/api/receipts`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/receipts` | Protected | List inbound receipts. |
| `POST` | `/api/receipts` | Protected | Create draft receipt. |
| `GET` | `/api/receipts/:id` | Protected | Get receipt details. |
| `PUT` | `/api/receipts/:id/status` | Protected | Update operational status (`Draft` -> `Waiting` -> `Ready`). |
| `POST` | `/api/receipts/:id/validate` | Protected | Complete receipt, increase stock, and write to ledger. |
| `POST` | `/api/receipts/:id/cancel` | Protected | Cancel receipt. |

### Deliveries (`/api/deliveries`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/deliveries` | Protected | List delivery orders. |
| `POST` | `/api/deliveries` | Protected | Create draft delivery order. |
| `GET` | `/api/deliveries/:id` | Protected | Get delivery order details. |
| `PUT` | `/api/deliveries/:id/status` | Protected | Update status (`Draft` -> `Waiting` -> `Ready`). |
| `POST` | `/api/deliveries/:id/confirm` | Protected | Confirm order. |
| `POST` | `/api/deliveries/:id/pick` | Protected | Pick line items. |
| `POST` | `/api/deliveries/:id/pack` | Protected | Pack items. |
| `POST` | `/api/deliveries/:id/validate` | Protected | Dispatch delivery, verify stock, deduct quantity, write ledger. |
| `POST` | `/api/deliveries/:id/cancel` | Protected | Cancel delivery order. |

### Transfers (`/api/transfers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/transfers` | Protected | List internal transfers. |
| `POST` | `/api/transfers` | Protected | Create transfer order. |
| `GET` | `/api/transfers/:id` | Protected | Get transfer details. |
| `POST` | `/api/transfers/:id/validate` | Protected | Execute atomic transfer between locations (creates IN/OUT ledger). |
| `POST` | `/api/transfers/:id/cancel` | Protected | Cancel transfer. |

### Adjustments (`/api/adjustments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/adjustments` | Protected | List physical inventory counts. |
| `POST` | `/api/adjustments` | Protected | Create stock adjustment. |
| `GET` | `/api/adjustments/:id` | Protected | Get adjustment details. |
| `POST` | `/api/adjustments/:id/validate` | Protected | Apply count, update inventory to counted quantity, record diff. |
| `POST` | `/api/adjustments/:id/cancel` | Protected | Cancel adjustment. |

### Stock Ledger (`/api/ledger` or `/api/history`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/ledger` | Protected | Query immutable movement logs (`product`, `warehouse`, `type`, `page`, `limit`). |

### Dashboard (`/api/dashboard` or `/api/dashboard/summary`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard` | Protected | Real-time KPI aggregation, 30-day movement trend, category & warehouse metrics. |

---

## 6. End-to-End Scenario Verification

The following standard lifecycle scenario is automated in `backend/src/tests/inventory.e2e.test.js`:

1. **Receipt:** Receive 100 units of `Steel Rod` at Storage A:
   - `Storage A` = 100
   - Ledger: `+100 RECEIPT`
2. **Transfer:** Move 30 units from Storage A to Storage B:
   - `Storage A` = 70
   - `Storage B` = 30
   - Total System Stock = 100
   - Ledger: `-30 TRANSFER_OUT` & `+30 TRANSFER_IN`
3. **Delivery:** Deliver 20 units from Storage B:
   - `Storage B` = 10
   - Total System Stock = 80
   - Ledger: `-20 DELIVERY`
4. **Adjustment:** Physical count at Storage B is 7 (Recorded = 10, Difference = -3):
   - `Storage B` = 7
   - `Storage A` = 70
   - Total System Stock = 77
   - Ledger: `-3 ADJUSTMENT`
