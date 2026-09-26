// In-browser mock database and business logic engine
// Fully removes any backend dependency and stores data in localStorage

export interface Category {
  _id: string;
  name: string;
  description: string;
  color?: string;
}

export interface Location {
  _id: string;
  name: string;
  type: string;
  code: string;
}

export interface Warehouse {
  _id: string;
  name: string;
  code: string;
  address: string;
  locations: Location[];
}

export interface Product {
  _id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: Category;
  uom: string;
  costPrice: number;
  sellingPrice: number;
  minStock: number;
  totalStock: number;
  warehouseStock: Record<string, number>; // warehouseId -> stock
  barcode?: string;
  createdAt: string;
}

export interface ReceiptLine {
  productId: Product | string;
  expectedQty: number;
  receivedQty?: number;
  unitCost?: number;
}

export interface Receipt {
  _id: string;
  code: string;
  supplier: string;
  warehouseId: Warehouse;
  lines: ReceiptLine[];
  status: 'Draft' | 'Waiting' | 'Ready' | 'Done' | 'Canceled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryLine {
  productId: Product | string;
  qty: number;
  unitPrice?: number;
}

export interface Delivery {
  _id: string;
  code: string;
  customer: string;
  warehouseId: Warehouse;
  lines: DeliveryLine[];
  status: 'Draft' | 'Waiting' | 'Ready' | 'Done' | 'Canceled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferLine {
  productId: Product | string;
  qty: number;
}

export interface Transfer {
  _id: string;
  code: string;
  fromWarehouseId: Warehouse;
  fromLocationId: Location;
  toWarehouseId: Warehouse;
  toLocationId: Location;
  lines: TransferLine[];
  status: 'Draft' | 'Done' | 'Canceled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdjustmentLine {
  productId: Product | string;
  systemQty: number;
  countedQty: number;
  variance?: number;
}

export interface Adjustment {
  _id: string;
  code: string;
  warehouseId: Warehouse;
  reason: string;
  lines: AdjustmentLine[];
  status: 'Draft' | 'Done' | 'Canceled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockLedgerEntry {
  _id: string;
  documentType: 'Receipt' | 'Delivery' | 'Transfer' | 'Adjustment';
  documentCode: string;
  documentId: string;
  productId: Product;
  warehouseId?: Warehouse;
  fromLocationId?: Location;
  toLocationId?: Location;
  qty: number;
  balanceAfter: number;
  timestamp: string;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  company?: string;
}

// STORAGE KEYS
const STORAGE_PREFIX = 'stocksense_';
const KEYS = {
  USERS: `${STORAGE_PREFIX}users`,
  CATEGORIES: `${STORAGE_PREFIX}categories`,
  WAREHOUSES: `${STORAGE_PREFIX}warehouses`,
  PRODUCTS: `${STORAGE_PREFIX}products`,
  RECEIPTS: `${STORAGE_PREFIX}receipts`,
  DELIVERIES: `${STORAGE_PREFIX}deliveries`,
  TRANSFERS: `${STORAGE_PREFIX}transfers`,
  ADJUSTMENTS: `${STORAGE_PREFIX}adjustments`,
  LEDGER: `${STORAGE_PREFIX}ledger`,
  RESET_TOKEN: `${STORAGE_PREFIX}reset_tokens`,
};

// INITIAL SEED DATA
const INITIAL_CATEGORIES: Category[] = [
  { _id: 'cat-1', name: 'Electronics & Sensors', description: 'Microcontrollers, boards, and sensors', color: '#6366f1' },
  { _id: 'cat-2', name: 'Packaging & Enclosures', description: 'Industrial casing, boxes, packing foam', color: '#10b981' },
  { _id: 'cat-3', name: 'Fasteners & Hardware', description: 'Bolts, brackets, precision screws', color: '#f59e0b' },
  { _id: 'cat-4', name: 'Power & Batteries', description: 'Lithium battery packs, chargers, power supplies', color: '#ef4444' },
  { _id: 'cat-5', name: 'Cables & Interconnects', description: 'Shielded USB-C, ribbon cables, headers', color: '#8b5cf6' },
];

const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    _id: 'wh-1',
    name: 'Central Logistics Hub',
    code: 'WH-CENTRAL',
    address: 'Building 4, Metro Industrial Park, Tech Corridor',
    locations: [
      { _id: 'loc-1-1', name: 'Zone A - High Density Racks', type: 'Storage', code: 'A-RACK-01' },
      { _id: 'loc-1-2', name: 'Zone B - Climate Controlled', type: 'Storage', code: 'B-COLD-01' },
      { _id: 'loc-1-3', name: 'Dock 1 Receiving', type: 'Receiving', code: 'DOCK-IN-1' },
      { _id: 'loc-1-4', name: 'Staging & Dispatch Bay', type: 'Dispatch', code: 'DISPATCH-BAY' },
    ],
  },
  {
    _id: 'wh-2',
    name: 'Pacific Coast Distribution',
    code: 'WH-PACIFIC',
    address: 'Bay 12, Harbor Free Trade Zone',
    locations: [
      { _id: 'loc-2-1', name: 'Main Shelving Unit 1', type: 'Storage', code: 'P-SHELF-01' },
      { _id: 'loc-2-2', name: 'Bulk Pallet Bay', type: 'Storage', code: 'P-PALLET-02' },
      { _id: 'loc-2-3', name: 'Inbound Inspection', type: 'Receiving', code: 'P-INSPECT' },
    ],
  },
  {
    _id: 'wh-3',
    name: 'Euro Regional Depot',
    code: 'WH-EUROPE',
    address: 'Cargo City Sud, Gate 25, Logistics Hub',
    locations: [
      { _id: 'loc-3-1', name: 'Rack Section North', type: 'Storage', code: 'EU-NORTH-01' },
      { _id: 'loc-3-2', name: 'Express Fulfillment Lane', type: 'Dispatch', code: 'EU-EXP-LANE' },
    ],
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    _id: 'prod-1',
    sku: 'EL-MCU-001',
    name: 'ARM Cortex-M4 Development Board',
    description: '120MHz 32-bit MCU with DSP & FPU, 512KB Flash',
    categoryId: INITIAL_CATEGORIES[0],
    uom: 'pcs',
    costPrice: 14.50,
    sellingPrice: 28.00,
    minStock: 25,
    totalStock: 142,
    warehouseStock: { 'wh-1': 82, 'wh-2': 40, 'wh-3': 20 },
    barcode: '8901234567890',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    _id: 'prod-2',
    sku: 'EL-SNS-002',
    name: 'Industrial LiDAR Distance Sensor',
    description: 'Time-of-Flight sensor module up to 12 meters with I2C/UART',
    categoryId: INITIAL_CATEGORIES[0],
    uom: 'pcs',
    costPrice: 42.00,
    sellingPrice: 79.99,
    minStock: 15,
    totalStock: 12, // LOW STOCK
    warehouseStock: { 'wh-1': 7, 'wh-2': 5, 'wh-3': 0 },
    barcode: '8901234567891',
    createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
  },
  {
    _id: 'prod-3',
    sku: 'PWR-BAT-003',
    name: 'LiFePO4 3.2V 5000mAh Cell',
    description: 'High discharge rechargeable lithium iron phosphate battery cell',
    categoryId: INITIAL_CATEGORIES[3],
    uom: 'pcs',
    costPrice: 6.80,
    sellingPrice: 14.20,
    minStock: 50,
    totalStock: 320,
    warehouseStock: { 'wh-1': 200, 'wh-2': 100, 'wh-3': 20 },
    barcode: '8901234567892',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    _id: 'prod-4',
    sku: 'ENC-ALU-004',
    name: 'Anodized Aluminum IP67 Enclosure',
    description: 'Milled aluminum enclosure with silicone gasket seal',
    categoryId: INITIAL_CATEGORIES[1],
    uom: 'pcs',
    costPrice: 18.00,
    sellingPrice: 36.50,
    minStock: 20,
    totalStock: 4, // CRITICAL LOW
    warehouseStock: { 'wh-1': 4, 'wh-2': 0, 'wh-3': 0 },
    barcode: '8901234567893',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    _id: 'prod-5',
    sku: 'CBL-USBC-005',
    name: 'Braided USB-C PD 100W Cable (2m)',
    description: 'Heavy duty nylon braided E-marker certified power delivery cable',
    categoryId: INITIAL_CATEGORIES[4],
    uom: 'pcs',
    costPrice: 3.20,
    sellingPrice: 9.99,
    minStock: 40,
    totalStock: 210,
    warehouseStock: { 'wh-1': 110, 'wh-2': 70, 'wh-3': 30 },
    barcode: '8901234567894',
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    _id: 'prod-6',
    sku: 'FST-M3-006',
    name: 'Stainless Steel M3 Hex Standoff Kit',
    description: '300-piece kit: M3 male/female standoffs, screws, and hex nuts',
    categoryId: INITIAL_CATEGORIES[2],
    uom: 'box',
    costPrice: 8.50,
    sellingPrice: 19.50,
    minStock: 10,
    totalStock: 0, // OUT OF STOCK
    warehouseStock: { 'wh-1': 0, 'wh-2': 0, 'wh-3': 0 },
    barcode: '8901234567895',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    _id: 'prod-7',
    sku: 'PWR-SMPS-007',
    name: 'Industrial Din Rail Power Supply 24V 5A',
    description: '120W AC-DC ultra slim DIN rail power supply with PFC',
    categoryId: INITIAL_CATEGORIES[3],
    uom: 'pcs',
    costPrice: 22.00,
    sellingPrice: 48.00,
    minStock: 15,
    totalStock: 58,
    warehouseStock: { 'wh-1': 30, 'wh-2': 18, 'wh-3': 10 },
    barcode: '8901234567896',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    _id: 'prod-8',
    sku: 'EL-BLE-008',
    name: 'Bluetooth 5.3 Low Energy Module',
    description: 'Certified BLE module with integrated PCB trace antenna',
    categoryId: INITIAL_CATEGORIES[0],
    uom: 'pcs',
    costPrice: 3.80,
    sellingPrice: 8.20,
    minStock: 100,
    totalStock: 540,
    warehouseStock: { 'wh-1': 340, 'wh-2': 120, 'wh-3': 80 },
    barcode: '8901234567897',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const INITIAL_RECEIPTS: Receipt[] = [
  {
    _id: 'rec-101',
    code: 'REC-2026-001',
    supplier: 'Apex Microelectronics Ltd',
    warehouseId: INITIAL_WAREHOUSES[0],
    lines: [
      { productId: INITIAL_PRODUCTS[0], expectedQty: 100, receivedQty: 100, unitCost: 14.50 },
    ],
    status: 'Done',
    notes: 'Received and verified in Dock 1. Batch inspection passed.',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    _id: 'rec-102',
    code: 'REC-2026-002',
    supplier: 'Titanium Hardware & Fasteners Corp',
    warehouseId: INITIAL_WAREHOUSES[1],
    lines: [
      { productId: INITIAL_PRODUCTS[5], expectedQty: 50, receivedQty: 0, unitCost: 8.50 },
    ],
    status: 'Ready',
    notes: 'Container reached port. Pending warehouse intake scan.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    _id: 'rec-103',
    code: 'REC-2026-003',
    supplier: 'Shenzhen Optics & Photonics Co',
    warehouseId: INITIAL_WAREHOUSES[0],
    lines: [
      { productId: INITIAL_PRODUCTS[1], expectedQty: 40, receivedQty: 0, unitCost: 42.00 },
    ],
    status: 'Waiting',
    notes: 'Air cargo tracking number confirmed. Estimated arrival tomorrow.',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    _id: 'rec-104',
    code: 'REC-2026-004',
    supplier: 'EuroPack Polymers GmbH',
    warehouseId: INITIAL_WAREHOUSES[2],
    lines: [
      { productId: INITIAL_PRODUCTS[3], expectedQty: 30, receivedQty: 0, unitCost: 18.00 },
    ],
    status: 'Draft',
    notes: 'Supplier quotation finalized. PO issued.',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
];

const INITIAL_DELIVERIES: Delivery[] = [
  {
    _id: 'del-201',
    code: 'DEL-2026-001',
    customer: 'Tesla Robotics Division',
    warehouseId: INITIAL_WAREHOUSES[0],
    lines: [
      { productId: INITIAL_PRODUCTS[2], qty: 50, unitPrice: 14.20 },
      { productId: INITIAL_PRODUCTS[0], qty: 20, unitPrice: 28.00 },
    ],
    status: 'Done',
    notes: 'Priority air freight dispatch. Delivered and signed.',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    _id: 'del-202',
    code: 'DEL-2026-002',
    customer: 'Nordic Automation AS',
    warehouseId: INITIAL_WAREHOUSES[0],
    lines: [
      { productId: INITIAL_PRODUCTS[6], qty: 10, unitPrice: 48.00 },
      { productId: INITIAL_PRODUCTS[7], qty: 100, unitPrice: 8.20 },
    ],
    status: 'Ready',
    notes: 'All items picked and packed in Staging Bay. Awaiting courier pickup.',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    _id: 'del-203',
    code: 'DEL-2026-003',
    customer: 'CyberDyne Labs',
    warehouseId: INITIAL_WAREHOUSES[1],
    lines: [
      { productId: INITIAL_PRODUCTS[4], qty: 25, unitPrice: 9.99 },
    ],
    status: 'Draft',
    notes: 'Order received via API. Pending warehouse batch allocation.',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
];

const INITIAL_TRANSFERS: Transfer[] = [
  {
    _id: 'trf-301',
    code: 'TRF-2026-001',
    fromWarehouseId: INITIAL_WAREHOUSES[0],
    fromLocationId: INITIAL_WAREHOUSES[0].locations[0],
    toWarehouseId: INITIAL_WAREHOUSES[1],
    toLocationId: INITIAL_WAREHOUSES[1].locations[0],
    lines: [
      { productId: INITIAL_PRODUCTS[0], qty: 20 },
    ],
    status: 'Done',
    notes: 'Inter-warehouse stock balancing.',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    _id: 'trf-302',
    code: 'TRF-2026-002',
    fromWarehouseId: INITIAL_WAREHOUSES[0],
    fromLocationId: INITIAL_WAREHOUSES[0].locations[1],
    toWarehouseId: INITIAL_WAREHOUSES[2],
    toLocationId: INITIAL_WAREHOUSES[2].locations[0],
    lines: [
      { productId: INITIAL_PRODUCTS[4], qty: 30 },
    ],
    status: 'Draft',
    notes: 'Replenishing European regional hub.',
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
];

const INITIAL_ADJUSTMENTS: Adjustment[] = [
  {
    _id: 'adj-401',
    code: 'ADJ-2026-001',
    warehouseId: INITIAL_WAREHOUSES[0],
    reason: 'Quarterly Cycle Count',
    lines: [
      { productId: INITIAL_PRODUCTS[0], systemQty: 80, countedQty: 82, variance: 2 },
    ],
    status: 'Done',
    notes: 'Found 2 extra sealed units on Upper Shelf A-2.',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    _id: 'adj-402',
    code: 'ADJ-2026-002',
    warehouseId: INITIAL_WAREHOUSES[1],
    reason: 'Damaged in transit inspection',
    lines: [
      { productId: INITIAL_PRODUCTS[3], systemQty: 6, countedQty: 4, variance: -2 },
    ],
    status: 'Draft',
    notes: 'Two units dropped during forklift maneuver; pending supervisor sign-off.',
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
];

const INITIAL_LEDGER: StockLedgerEntry[] = [
  {
    _id: 'led-1',
    documentType: 'Receipt',
    documentCode: 'REC-2026-001',
    documentId: 'rec-101',
    productId: INITIAL_PRODUCTS[0],
    warehouseId: INITIAL_WAREHOUSES[0],
    qty: 100,
    balanceAfter: 100,
    timestamp: new Date(Date.now() - 6 * 86400000).toISOString(),
    notes: 'Initial inbound shipment from Apex Micro',
  },
  {
    _id: 'led-2',
    documentType: 'Transfer',
    documentCode: 'TRF-2026-001',
    documentId: 'trf-301',
    productId: INITIAL_PRODUCTS[0],
    fromLocationId: INITIAL_WAREHOUSES[0].locations[0],
    toLocationId: INITIAL_WAREHOUSES[1].locations[0],
    qty: -20,
    balanceAfter: 80,
    timestamp: new Date(Date.now() - 6 * 86400000 + 3600000).toISOString(),
    notes: 'Outbound transfer to Pacific Coast',
  },
  {
    _id: 'led-3',
    documentType: 'Transfer',
    documentCode: 'TRF-2026-001',
    documentId: 'trf-301',
    productId: INITIAL_PRODUCTS[0],
    warehouseId: INITIAL_WAREHOUSES[1],
    toLocationId: INITIAL_WAREHOUSES[1].locations[0],
    qty: 20,
    balanceAfter: 20,
    timestamp: new Date(Date.now() - 6 * 86400000 + 7200000).toISOString(),
    notes: 'Inbound transfer received at Pacific Coast',
  },
  {
    _id: 'led-4',
    documentType: 'Delivery',
    documentCode: 'DEL-2026-001',
    documentId: 'del-201',
    productId: INITIAL_PRODUCTS[2],
    warehouseId: INITIAL_WAREHOUSES[0],
    qty: -50,
    balanceAfter: 200,
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    notes: 'Order fulfillment for Tesla Robotics',
  },
  {
    _id: 'led-5',
    documentType: 'Delivery',
    documentCode: 'DEL-2026-001',
    documentId: 'del-201',
    productId: INITIAL_PRODUCTS[0],
    warehouseId: INITIAL_WAREHOUSES[0],
    qty: -20,
    balanceAfter: 60,
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    notes: 'Order fulfillment for Tesla Robotics',
  },
  {
    _id: 'led-6',
    documentType: 'Adjustment',
    documentCode: 'ADJ-2026-001',
    documentId: 'adj-401',
    productId: INITIAL_PRODUCTS[0],
    warehouseId: INITIAL_WAREHOUSES[0],
    qty: 2,
    balanceAfter: 62,
    timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
    notes: 'Stock count surplus adjustment',
  },
];

const INITIAL_USERS: User[] = [
  {
    id: 'user-demo-1',
    name: 'Alex Harrison',
    email: 'demo@stocksense.app',
    role: 'Lead Inventory Architect',
    company: 'StockSense Global Logistics',
    avatar: 'AH',
  },
];

class MockDbService {
  constructor() {
    this.init();
  }

  public init(forceReset = false): void {
    if (!forceReset && localStorage.getItem(KEYS.PRODUCTS)) {
      return;
    }

    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(KEYS.WAREHOUSES, JSON.stringify(INITIAL_WAREHOUSES));
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(KEYS.RECEIPTS, JSON.stringify(INITIAL_RECEIPTS));
    localStorage.setItem(KEYS.DELIVERIES, JSON.stringify(INITIAL_DELIVERIES));
    localStorage.setItem(KEYS.TRANSFERS, JSON.stringify(INITIAL_TRANSFERS));
    localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify(INITIAL_ADJUSTMENTS));
    localStorage.setItem(KEYS.LEDGER, JSON.stringify(INITIAL_LEDGER));
    localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }

  public resetAllData(): void {
    this.init(true);
  }

  // --- GENERIC GET & SAVE ---
  private get<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private set<T>(key: string, val: T): void {
    localStorage.setItem(key, JSON.stringify(val));
  }

  // --- AUTH ---
  public login(email: string, _pass?: string): { user: User; token: string } {
    const users = this.get<User[]>(KEYS.USERS, INITIAL_USERS);
    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
        email: email.toLowerCase(),
        role: 'Operations Specialist',
        company: 'StockSense Logistics',
        avatar: email.substring(0, 2).toUpperCase(),
      };
      users.push(user);
      this.set(KEYS.USERS, users);
    }
    const token = `jwt_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return { user, token };
  }

  public signup(name: string, email: string): { user: User; token: string } {
    const users = this.get<User[]>(KEYS.USERS, INITIAL_USERS);
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      const token = `jwt_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return { user: existing, token };
    }
    const initials = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'DU';
    const user: User = {
      id: `user-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role: 'Operations Specialist',
      company: 'StockSense Hub',
      avatar: initials,
    };
    users.push(user);
    this.set(KEYS.USERS, users);
    const token = `jwt_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return { user, token };
  }

  public updateProfile(data: { name: string; email: string }): User {
    const users = this.get<User[]>(KEYS.USERS, INITIAL_USERS);
    let user = users[0];
    if (user) {
      user.name = data.name;
      user.email = data.email;
      this.set(KEYS.USERS, users);
    }
    return user;
  }

  // --- CATEGORIES & WAREHOUSES ---
  public getCategories(): Category[] {
    return this.get<Category[]>(KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  public getWarehouses(): Warehouse[] {
    return this.get<Warehouse[]>(KEYS.WAREHOUSES, INITIAL_WAREHOUSES);
  }

  // --- PRODUCTS ---
  public getProducts(params?: Record<string, string>): Product[] {
    let prods = this.get<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);

    if (params?.search) {
      const q = params.search.toLowerCase();
      prods = prods.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoryId?.name?.toLowerCase().includes(q)
      );
    }

    if (params?.filter === 'low-stock') {
      prods = prods.filter((p) => p.totalStock > 0 && p.totalStock <= p.minStock);
    } else if (params?.filter === 'out-of-stock') {
      prods = prods.filter((p) => p.totalStock === 0);
    } else if (params?.filter === 'in-stock') {
      prods = prods.filter((p) => p.totalStock > p.minStock);
    }

    if (params?.category) {
      prods = prods.filter((p) => p.categoryId?._id === params.category || p.categoryId?.name === params.category);
    }

    return prods;
  }

  public getProduct(id: string): Product | undefined {
    const prods = this.get<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return prods.find((p) => p._id === id);
  }

  public createProduct(data: Partial<Product>): Product {
    const prods = this.get<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const categories = this.getCategories();
    const warehouses = this.getWarehouses();

    const category = categories.find((c) => c._id === (data as any).categoryId) || categories[0];
    const initialQty = Number(data.totalStock) || 0;

    const warehouseStock: Record<string, number> = {};
    if (warehouses[0]) {
      warehouseStock[warehouses[0]._id] = initialQty;
    }

    const newProd: Product = {
      _id: `prod-${Date.now()}`,
      sku: data.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: data.name || 'Untitled Product',
      description: data.description || '',
      categoryId: category,
      uom: data.uom || 'pcs',
      costPrice: Number(data.costPrice) || 10,
      sellingPrice: Number(data.sellingPrice) || 20,
      minStock: Number(data.minStock) || 15,
      totalStock: initialQty,
      warehouseStock: warehouseStock,
      barcode: data.barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      createdAt: new Date().toISOString(),
    };

    prods.unshift(newProd);
    this.set(KEYS.PRODUCTS, prods);

    if (initialQty > 0) {
      this.recordLedgerEntry({
        documentType: 'Adjustment',
        documentCode: `INIT-${newProd.sku}`,
        documentId: newProd._id,
        productId: newProd,
        warehouseId: warehouses[0],
        qty: initialQty,
        balanceAfter: initialQty,
        notes: 'Initial inventory stock on creation',
      });
    }

    return newProd;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product {
    const prods = this.get<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const idx = prods.findIndex((p) => p._id === id);
    if (idx === -1) throw new Error('Product not found');
    prods[idx] = { ...prods[idx], ...updates };
    this.set(KEYS.PRODUCTS, prods);
    return prods[idx];
  }

  public deleteProduct(id: string): void {
    let prods = this.get<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    prods = prods.filter((p) => p._id !== id);
    this.set(KEYS.PRODUCTS, prods);
  }

  // --- RECEIPTS ---
  public getReceipts(params?: Record<string, string>): Receipt[] {
    let receipts = this.get<Receipt[]>(KEYS.RECEIPTS, INITIAL_RECEIPTS);
    if (params?.status) {
      receipts = receipts.filter((r) => r.status.toLowerCase() === params.status.toLowerCase());
    }
    return receipts;
  }

  public createReceipt(data: {
    supplier: string;
    warehouseId: string;
    lines: Array<{ productId: string; expectedQty: number; unitCost?: number }>;
    notes?: string;
  }): Receipt {
    const receipts = this.get<Receipt[]>(KEYS.RECEIPTS, INITIAL_RECEIPTS);
    const warehouses = this.getWarehouses();
    const prods = this.getProducts();

    const wh = warehouses.find((w) => w._id === data.warehouseId) || warehouses[0];
    const populatedLines: ReceiptLine[] = data.lines.map((l) => {
      const prod = prods.find((p) => p._id === l.productId) || prods[0];
      return {
        productId: prod,
        expectedQty: Number(l.expectedQty) || 1,
        receivedQty: 0,
        unitCost: Number(l.unitCost) || prod.costPrice,
      };
    });

    const newReceipt: Receipt = {
      _id: `rec-${Date.now()}`,
      code: `REC-${new Date().getFullYear()}-${String(receipts.length + 1).padStart(3, '0')}`,
      supplier: data.supplier,
      warehouseId: wh,
      lines: populatedLines,
      status: 'Draft',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    receipts.unshift(newReceipt);
    this.set(KEYS.RECEIPTS, receipts);
    return newReceipt;
  }

  public updateReceiptStatus(id: string, nextStatus: Receipt['status']): Receipt {
    const receipts = this.get<Receipt[]>(KEYS.RECEIPTS, INITIAL_RECEIPTS);
    const item = receipts.find((r) => r._id === id);
    if (!item) throw new Error('Receipt not found');
    item.status = nextStatus;
    item.updatedAt = new Date().toISOString();
    this.set(KEYS.RECEIPTS, receipts);
    return item;
  }

  public validateReceipt(id: string): Receipt {
    const receipts = this.get<Receipt[]>(KEYS.RECEIPTS, INITIAL_RECEIPTS);
    const item = receipts.find((r) => r._id === id);
    if (!item) throw new Error('Receipt not found');
    if (item.status === 'Done') return item;

    const prods = this.get<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const whId = item.warehouseId._id;

    for (const line of item.lines) {
      const prodId = typeof line.productId === 'object' ? line.productId._id : line.productId;
      const prod = prods.find((p) => p._id === prodId);
      if (prod) {
        const qty = line.expectedQty;
        prod.totalStock += qty;
        prod.warehouseStock = prod.warehouseStock || {};
        prod.warehouseStock[whId] = (prod.warehouseStock[whId] || 0) + qty;
        line.receivedQty = qty;

        this.recordLedgerEntry({
          documentType: 'Receipt',
          documentCode: item.code,
          documentId: item._id,
          productId: prod,
          warehouseId: item.warehouseId,
          toLocationId: item.warehouseId.locations?.[0],
          qty: qty,
          balanceAfter: prod.totalStock,
          notes: `Inbound receipt from ${item.supplier}`,
        });
      }
    }

    item.status = 'Done';
    item.updatedAt = new Date().toISOString();
    this.set(KEYS.PRODUCTS, prods);
    this.set(KEYS.RECEIPTS, receipts);
    return item;
  }

  // --- DELIVERIES ---
  public getDeliveries(params?: Record<string, string>): Delivery[] {
    let deliveries = this.get<Delivery[]>(KEYS.DELIVERIES, INITIAL_DELIVERIES);
    if (params?.status) {
      deliveries = deliveries.filter((d) => d.status.toLowerCase() === params.status.toLowerCase());
    }
    return deliveries;
  }

  public createDelivery(data: {
    customer: string;
    warehouseId: string;
    lines: Array<{ productId: string; qty: number; unitPrice?: number }>;
    notes?: string;
  }): Delivery {
    const deliveries = this.get<Delivery[]>(KEYS.DELIVERIES, INITIAL_DELIVERIES);
    const warehouses = this.getWarehouses();
    const prods = this.getProducts();

    const wh = warehouses.find((w) => w._id === data.warehouseId) || warehouses[0];
    const populatedLines: DeliveryLine[] = data.lines.map((l) => {
      const prod = prods.find((p) => p._id === l.productId) || prods[0];
      return {
        productId: prod,
        qty: Number(l.qty) || 1,
        unitPrice: Number(l.unitPrice) || prod.sellingPrice,
      };
    });

    const newDelivery: Delivery = {
      _id: `del-${Date.now()}`,
      code: `DEL-${new Date().getFullYear()}-${String(deliveries.length + 1).padStart(3, '0')}`,
      customer: data.customer,
      warehouseId: wh,
      lines: populatedLines,
      status: 'Draft',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    deliveries.unshift(newDelivery);
    this.set(KEYS.DELIVERIES, deliveries);
    return newDelivery;
  }

  public updateDeliveryStatus(id: string, nextStatus: Delivery['status']): Delivery {
    const deliveries = this.get<Delivery[]>(KEYS.DELIVERIES, INITIAL_DELIVERIES);
    const item = deliveries.find((d) => d._id === id);
    if (!item) throw new Error('Delivery not found');
    item.status = nextStatus;
    item.updatedAt = new Date().toISOString();
    this.set(KEYS.DELIVERIES, deliveries);
    return item;
  }

  public validateDelivery(id: string): Delivery {
    const deliveries = this.get<Delivery[]>(KEYS.DELIVERIES, INITIAL_DELIVERIES);
    const item = deliveries.find((d) => d._id === id);
    if (!item) throw new Error('Delivery not found');
    if (item.status === 'Done') return item;

    const prods = this.get<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const whId = item.warehouseId._id;

    for (const line of item.lines) {
      const prodId = typeof line.productId === 'object' ? line.productId._id : line.productId;
      const prod = prods.find((p) => p._id === prodId);
      if (!prod) throw new Error(`Product not found`);
      const available = prod.warehouseStock?.[whId] ?? prod.totalStock;
      if (available < line.qty) {
        throw new Error(
          `Insufficient stock for "${prod.name}" at ${item.warehouseId.name}. Requested: ${line.qty}, Available: ${available}`
        );
      }
    }

    for (const line of item.lines) {
      const prodId = typeof line.productId === 'object' ? line.productId._id : line.productId;
      const prod = prods.find((p) => p._id === prodId)!;
      prod.totalStock = Math.max(0, prod.totalStock - line.qty);
      if (prod.warehouseStock) {
        prod.warehouseStock[whId] = Math.max(0, (prod.warehouseStock[whId] || 0) - line.qty);
      }

      this.recordLedgerEntry({
        documentType: 'Delivery',
        documentCode: item.code,
        documentId: item._id,
        productId: prod,
        warehouseId: item.warehouseId,
        fromLocationId: item.warehouseId.locations?.[0],
        qty: -line.qty,
        balanceAfter: prod.totalStock,
        notes: `Outbound delivery to ${item.customer}`,
      });
    }

    item.status = 'Done';
    item.updatedAt = new Date().toISOString();
    this.set(KEYS.PRODUCTS, prods);
    this.set(KEYS.DELIVERIES, deliveries);
    return item;
  }

  // --- TRANSFERS ---
  public getTransfers(params?: Record<string, string>): Transfer[] {
    let transfers = this.get<Transfer[]>(KEYS.TRANSFERS, INITIAL_TRANSFERS);
    if (params?.status) {
      transfers = transfers.filter((t) => t.status.toLowerCase() === params.status.toLowerCase());
    }
    return transfers;
  }

  public createTransfer(data: {
    fromWarehouseId: string;
    fromLocationId: string;
    toWarehouseId: string;
    toLocationId: string;
    lines: Array<{ productId: string; qty: number }>;
    notes?: string;
  }): Transfer {
    const transfers = this.get<Transfer[]>(KEYS.TRANSFERS, INITIAL_TRANSFERS);
    const warehouses = this.getWarehouses();
    const prods = this.getProducts();

    const fromWh = warehouses.find((w) => w._id === data.fromWarehouseId) || warehouses[0];
    const toWh = warehouses.find((w) => w._id === data.toWarehouseId) || warehouses[1] || warehouses[0];

    const fromLoc =
      fromWh.locations.find((l) => l._id === data.fromLocationId) || fromWh.locations[0];
    const toLoc = toWh.locations.find((l) => l._id === data.toLocationId) || toWh.locations[0];

    const populatedLines: TransferLine[] = data.lines.map((l) => {
      const prod = prods.find((p) => p._id === l.productId) || prods[0];
      return {
        productId: prod,
        qty: Number(l.qty) || 1,
      };
    });

    const newTransfer: Transfer = {
      _id: `trf-${Date.now()}`,
      code: `TRF-${new Date().getFullYear()}-${String(transfers.length + 1).padStart(3, '0')}`,
      fromWarehouseId: fromWh,
      fromLocationId: fromLoc,
      toWarehouseId: toWh,
      toLocationId: toLoc,
      lines: populatedLines,
      status: 'Draft',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    transfers.unshift(newTransfer);
    this.set(KEYS.TRANSFERS, transfers);
    return newTransfer;
  }

  public validateTransfer(id: string): Transfer {
    const transfers = this.get<Transfer[]>(KEYS.TRANSFERS, INITIAL_TRANSFERS);
    const item = transfers.find((t) => t._id === id);
    if (!item) throw new Error('Transfer not found');
    if (item.status === 'Done') return item;

    const prods = this.get<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const fromWhId = item.fromWarehouseId._id;
    const toWhId = item.toWarehouseId._id;

    for (const line of item.lines) {
      const prodId = typeof line.productId === 'object' ? line.productId._id : line.productId;
      const prod = prods.find((p) => p._id === prodId);
      if (!prod) throw new Error('Product not found');
      const sourceStock = prod.warehouseStock?.[fromWhId] ?? prod.totalStock;
      if (sourceStock < line.qty) {
        throw new Error(
          `Insufficient stock at source warehouse "${item.fromWarehouseId.name}". Available: ${sourceStock}, Requested: ${line.qty}`
        );
      }
    }

    for (const line of item.lines) {
      const prodId = typeof line.productId === 'object' ? line.productId._id : line.productId;
      const prod = prods.find((p) => p._id === prodId)!;

      prod.warehouseStock = prod.warehouseStock || {};
      prod.warehouseStock[fromWhId] = Math.max(0, (prod.warehouseStock[fromWhId] || 0) - line.qty);
      prod.warehouseStock[toWhId] = (prod.warehouseStock[toWhId] || 0) + line.qty;

      this.recordLedgerEntry({
        documentType: 'Transfer',
        documentCode: item.code,
        documentId: item._id,
        productId: prod,
        fromLocationId: item.fromLocationId,
        toLocationId: item.toLocationId,
        qty: -line.qty,
        balanceAfter: prod.totalStock,
        notes: `Transfer outbound to ${item.toWarehouseId.name}`,
      });

      this.recordLedgerEntry({
        documentType: 'Transfer',
        documentCode: item.code,
        documentId: item._id,
        productId: prod,
        warehouseId: item.toWarehouseId,
        toLocationId: item.toLocationId,
        qty: line.qty,
        balanceAfter: prod.totalStock,
        notes: `Transfer inbound from ${item.fromWarehouseId.name}`,
      });
    }

    item.status = 'Done';
    item.updatedAt = new Date().toISOString();
    this.set(KEYS.PRODUCTS, prods);
    this.set(KEYS.TRANSFERS, transfers);
    return item;
  }

  // --- ADJUSTMENTS ---
  public getAdjustments(params?: Record<string, string>): Adjustment[] {
    let adjustments = this.get<Adjustment[]>(KEYS.ADJUSTMENTS, INITIAL_ADJUSTMENTS);
    if (params?.status) {
      adjustments = adjustments.filter((a) => a.status.toLowerCase() === params.status.toLowerCase());
    }
    return adjustments;
  }

  public createAdjustment(data: {
    reason: string;
    warehouseId: string;
    lines: Array<{ productId: string; systemQty: number; countedQty: number }>;
    notes?: string;
  }): Adjustment {
    const adjustments = this.get<Adjustment[]>(KEYS.ADJUSTMENTS, INITIAL_ADJUSTMENTS);
    const warehouses = this.getWarehouses();
    const prods = this.getProducts();

    const wh = warehouses.find((w) => w._id === data.warehouseId) || warehouses[0];
    const populatedLines: AdjustmentLine[] = data.lines.map((l) => {
      const prod = prods.find((p) => p._id === l.productId) || prods[0];
      const counted = Number(l.countedQty) || 0;
      const system = Number(l.systemQty) || (prod.warehouseStock?.[wh._id] ?? prod.totalStock);
      return {
        productId: prod,
        systemQty: system,
        countedQty: counted,
        variance: counted - system,
      };
    });

    const newAdj: Adjustment = {
      _id: `adj-${Date.now()}`,
      code: `ADJ-${new Date().getFullYear()}-${String(adjustments.length + 1).padStart(3, '0')}`,
      warehouseId: wh,
      reason: data.reason || 'Cycle Count',
      lines: populatedLines,
      status: 'Draft',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    adjustments.unshift(newAdj);
    this.set(KEYS.ADJUSTMENTS, adjustments);
    return newAdj;
  }

  public validateAdjustment(id: string): Adjustment {
    const adjustments = this.get<Adjustment[]>(KEYS.ADJUSTMENTS, INITIAL_ADJUSTMENTS);
    const item = adjustments.find((a) => a._id === id);
    if (!item) throw new Error('Adjustment not found');
    if (item.status === 'Done') return item;

    const prods = this.get<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const whId = item.warehouseId._id;

    for (const line of item.lines) {
      const prodId = typeof line.productId === 'object' ? line.productId._id : line.productId;
      const prod = prods.find((p) => p._id === prodId);
      if (prod) {
        const delta = line.countedQty - line.systemQty;
        prod.totalStock += delta;
        prod.warehouseStock = prod.warehouseStock || {};
        prod.warehouseStock[whId] = line.countedQty;

        this.recordLedgerEntry({
          documentType: 'Adjustment',
          documentCode: item.code,
          documentId: item._id,
          productId: prod,
          warehouseId: item.warehouseId,
          qty: delta,
          balanceAfter: prod.totalStock,
          notes: `Inventory adjustment (${item.reason})`,
        });
      }
    }

    item.status = 'Done';
    item.updatedAt = new Date().toISOString();
    this.set(KEYS.PRODUCTS, prods);
    this.set(KEYS.ADJUSTMENTS, adjustments);
    return item;
  }

  // --- LEDGER / MOVE HISTORY ---
  public getHistory(params?: Record<string, string>): { data: StockLedgerEntry[]; page: number; pages: number; total: number } {
    let ledger = this.get<StockLedgerEntry[]>(KEYS.LEDGER, INITIAL_LEDGER);

    if (params?.type) {
      ledger = ledger.filter((l) => l.documentType.toLowerCase() === params.type.toLowerCase());
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      ledger = ledger.filter(
        (l) =>
          l.documentCode.toLowerCase().includes(q) ||
          l.productId?.sku?.toLowerCase().includes(q) ||
          l.productId?.name?.toLowerCase().includes(q)
      );
    }

    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 15;
    const total = ledger.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const pagedData = ledger.slice(start, start + limit);

    return { data: pagedData, page, pages, total };
  }

  private recordLedgerEntry(entry: Omit<StockLedgerEntry, '_id' | 'timestamp'>): void {
    const ledger = this.get<StockLedgerEntry[]>(KEYS.LEDGER, INITIAL_LEDGER);
    const newEntry: StockLedgerEntry = {
      ...entry,
      _id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    ledger.unshift(newEntry);
    this.set(KEYS.LEDGER, ledger);
  }

  // --- DASHBOARD METRICS ---
  public getDashboardMetrics() {
    const prods = this.getProducts();
    const receipts = this.getReceipts();
    const deliveries = this.getDeliveries();
    const transfers = this.getTransfers();
    const ledger = this.get<StockLedgerEntry[]>(KEYS.LEDGER, INITIAL_LEDGER);
    const categories = this.getCategories();
    const warehouses = this.getWarehouses();

    const lowStockItems = prods.filter((p) => p.totalStock > 0 && p.totalStock <= p.minStock).length;
    const outOfStockItems = prods.filter((p) => p.totalStock === 0).length;
    const pendingReceipts = receipts.filter((r) => r.status !== 'Done' && r.status !== 'Canceled').length;
    const pendingDeliveries = deliveries.filter((d) => d.status !== 'Done' && d.status !== 'Canceled').length;
    const pendingTransfers = transfers.filter((t) => t.status !== 'Done' && t.status !== 'Canceled').length;

    const totalInventoryValue = prods.reduce((sum, p) => sum + p.totalStock * p.costPrice, 0);

    const trendMap: Record<string, { Inbound: number; Outbound: number }> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      trendMap[key] = { Inbound: 0, Outbound: 0 };
    }

    const dateKeys = Object.keys(trendMap);
    dateKeys.forEach((k, idx) => {
      const wave = Math.sin(idx * 0.4);
      trendMap[k].Inbound = Math.floor(18 + wave * 12 + (idx % 5) * 4);
      trendMap[k].Outbound = Math.floor(14 - wave * 8 + ((idx + 2) % 4) * 5);
    });

    ledger.forEach((entry) => {
      const d = new Date(entry.timestamp);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (trendMap[key]) {
        if (entry.qty > 0) trendMap[key].Inbound += entry.qty;
        else if (entry.qty < 0) trendMap[key].Outbound += Math.abs(entry.qty);
      }
    });

    const trendData = Object.entries(trendMap).map(([date, vals]) => ({
      date,
      Inbound: vals.Inbound,
      Outbound: vals.Outbound,
    }));

    const categoryDistribution = categories.map((cat) => {
      const catProds = prods.filter((p) => p.categoryId?._id === cat._id);
      const totalUnits = catProds.reduce((sum, p) => sum + p.totalStock, 0);
      const value = catProds.reduce((sum, p) => sum + p.totalStock * p.costPrice, 0);
      return {
        name: cat.name,
        color: cat.color || '#6366f1',
        units: totalUnits,
        value: Math.round(value),
        productCount: catProds.length,
      };
    });

    const warehouseBreakdown = warehouses.map((wh) => {
      const units = prods.reduce((sum, p) => sum + (p.warehouseStock?.[wh._id] || 0), 0);
      const value = prods.reduce((sum, p) => sum + (p.warehouseStock?.[wh._id] || 0) * p.costPrice, 0);
      return {
        id: wh._id,
        name: wh.name,
        code: wh.code,
        units,
        value: Math.round(value),
      };
    });

    const recentActivity = ledger.slice(0, 8);

    return {
      kpis: {
        totalProducts: prods.length,
        totalInventoryValue: Math.round(totalInventoryValue),
        lowStockItems,
        outOfStockItems,
        pendingReceipts,
        pendingDeliveries,
        pendingTransfers,
      },
      trendData,
      recentActivity,
      categoryDistribution,
      warehouseBreakdown,
    };
  }
}

export const mockDb = new MockDbService();
