/** Shared domain model for StockSense ERP. Mirrors the wireframe source-of-truth. */

export type LocationCode =
  | 'WH/Stock1'
  | 'WH/Stock1/Heavy-Rack-01'
  | 'WH/Stock1/Bay04'
  | 'WH/Stock2'
  | 'WH/Stock2/RackB'
  | 'WH/Production'
  | 'WH/Rack-A'
  | 'WH/Input'
  | 'WH/Input/Dock-02N'
  | 'WH/Output/Dock-01'
  | 'WH/Cold-Zone'
  | 'WH/Cold/Vault-L1'
  | 'WH/Quarantine-Zone';

export type Unit = 'kg' | 'Units' | 'Rolls' | 'spools' | 'packs';

export type ProductStatus = 'IN_STOCK' | 'LOW' | 'OUT';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: Unit;
  unitCost: number;
  /** reorder / safety-stock threshold */
  reorderPoint: number;
  /** qty committed to open outbound orders (soft reservation) */
  reserved: number;
  /** physical on-hand, keyed by location code */
  stock: Record<string, number>;
  icon: string;
}

export type DocStatus = 'Draft' | 'Waiting' | 'Ready' | 'Packed' | 'Done' | 'Overdue' | 'Canceled';

export interface ReceiptLine {
  sku: string;
  expected: number;
  received: number;
  bin: string;
  lot: string;
  barcode: string;
}

export interface Receipt {
  ref: string;
  supplier: string;
  supplierTier: 'Tier 1 Vendor' | 'Tier 2 Vendor' | 'Unverified';
  poRef: string;
  bolRef: string;
  destination: LocationCode;
  contact: string;
  scheduledDate: string;
  carrier: string;
  dockBay: string;
  status: DocStatus;
  items: ReceiptLine[];
  notes: string;
  createdAt: string;
  createdBy: string;
  postedAt?: string;
}

export interface DeliveryLine {
  sku: string;
  qty: number;
  bin: string;
}

export interface Delivery {
  ref: string;
  from: LocationCode;
  to: string;
  contact: string;
  address: string;
  scheduledDate: string;
  carrier: string;
  status: DocStatus;
  operationType: string;
  items: DeliveryLine[];
  notes: string;
  createdAt: string;
  createdBy: string;
  postedAt?: string;
}

export interface Transfer {
  ref: string;
  from: LocationCode;
  to: LocationCode;
  sku: string;
  qty: number;
  requestedBy: string;
  status: DocStatus;
  createdAt: string;
}

export type AdjustmentReason =
  | 'Damaged in Transit'
  | 'Missing / Investigation'
  | 'Incorrect Entry / Counting Error'
  | 'Scrap / Wear & Tear'
  | 'Supplier Surplus'
  | 'Other';

export type AdjustmentState = 'Pending Approval' | 'Reconciled' | 'Posted';

export interface Adjustment {
  ref: string;
  sku: string;
  location: LocationCode;
  recorded: number;
  counted: number;
  delta: number;
  reason: AdjustmentReason;
  memo: string;
  auditor: string;
  state: AdjustmentState;
  valuationImpact: number;
  createdAt: string;
  postedAt?: string;
}

export type LedgerType = 'RECEIPT' | 'DELIVERY' | 'TRANSFER' | 'ADJUSTMENT';

export interface LedgerEntry {
  id: string;
  timestamp: string;
  type: LedgerType;
  ref: string;
  sku: string;
  name: string;
  /** signed change of the *global* balance; transfers are 0 */
  delta: number;
  from: string;
  to: string;
  balanceAfter: number;
  user: string;
  note: string;
}

export interface Warehouse {
  code: string;
  name: string;
  type: 'Main Fulfillment' | 'Cold Chain' | 'Transit Hub';
  address: string;
  manager: string;
  capacityUsedPct: number;
  locationCount: number;
}

export interface StorageLocation {
  code: string;
  name: string;
  shortCode: string;
  warehouse: string;
  type:
    | 'Internal Storage'
    | 'Heavy Floor'
    | 'Cold Chain'
    | 'Inward Dock'
    | 'Outward Pack'
    | 'Quarantine';
  skuCount: number;
  maxLoad: string;
  status: 'Active' | 'Receiving' | 'Ready' | 'Chill Pass' | 'Locked';
}

export interface User {
  name: string;
  role: 'Inventory Manager' | 'Warehouse Staff' | 'Floor Supervisor';
  initials: string;
  auditorId: string;
}

export interface Settings {
  valuationMethod: 'FIFO' | 'AVCO';
  removalStrategy: 'FIFO' | 'FEFO';
  preventNegativeStock: boolean;
  dualSignoffThreshold: number;
  dualSignoffVariancePct: number;
  currency: string;
}

export interface Database {
  version: number;
  settings: Settings;
  users: User[];
  warehouses: Warehouse[];
  locations: StorageLocation[];
  products: Product[];
  receipts: Receipt[];
  deliveries: Delivery[];
  transfers: Transfer[];
  adjustments: Adjustment[];
  ledger: LedgerEntry[];
}
