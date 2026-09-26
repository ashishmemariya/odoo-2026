import mongoose from 'mongoose';
import env from './config/env.js';
import User, { USER_ROLES } from './models/User.js';
import Category from './models/Category.js';
import Warehouse from './models/Warehouse.js';
import Location from './models/Location.js';
import Product from './models/Product.js';
import stockService from './services/stockService.js';

export const seedDatabase = async () => {
  console.log('🌱 Checking if database needs initial seeding…');

  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('ℹ️  Database already contains users. Skipping initial seed.');
    return;
  }

  console.log('🚀 Seeding initial StockSense demo data…');

  // 1. Create Demo Admin User
  const demoUser = await User.create({
    name: 'Alex Harrison',
    email: 'demo@stocksense.app',
    password: 'Demo@1234',
    role: USER_ROLES.INVENTORY_MANAGER,
    isActive: true,
  });

  const staffUser = await User.create({
    name: 'Sarah Chen',
    email: 'staff@stocksense.app',
    password: 'Demo@1234',
    role: USER_ROLES.WAREHOUSE_STAFF,
    isActive: true,
  });

  console.log(`👤 Created Demo Admin: ${demoUser.email} / Demo@1234`);
  console.log(`👤 Created Warehouse Staff: ${staffUser.email} / Demo@1234`);

  // 2. Create Categories
  const categories = await Category.create([
    { name: 'Electronics & Sensors', description: 'Microcontrollers, boards, and sensors', color: '#6366f1' },
    { name: 'Packaging & Enclosures', description: 'Industrial casing, boxes, packing foam', color: '#10b981' },
    { name: 'Fasteners & Hardware', description: 'Bolts, brackets, precision screws', color: '#f59e0b' },
    { name: 'Power & Batteries', description: 'Lithium battery packs, chargers, power supplies', color: '#ef4444' },
    { name: 'Cables & Interconnects', description: 'Shielded USB-C, ribbon cables, headers', color: '#8b5cf6' },
  ]);

  // 3. Create Warehouses & Locations
  const warehouse1 = await Warehouse.create({
    name: 'Central Logistics Hub',
    code: 'WH-CENTRAL',
    address: 'Building 4, Metro Industrial Park, Tech Corridor',
    locations: [
      { name: 'Zone A - High Density Racks', code: 'A-RACK-01', type: 'Storage' },
      { name: 'Zone B - Climate Controlled', code: 'B-COLD-01', type: 'Storage' },
      { name: 'Dock 1 Receiving', code: 'DOCK-IN-1', type: 'Receiving' },
      { name: 'Staging & Dispatch Bay', code: 'DISPATCH-BAY', type: 'Dispatch' },
    ],
  });

  for (const loc of warehouse1.locations) {
    await Location.create({ warehouse: warehouse1._id, name: loc.name, code: loc.code, type: loc.type });
  }

  const warehouse2 = await Warehouse.create({
    name: 'Pacific Coast Distribution',
    code: 'WH-PACIFIC',
    address: 'Bay 12, Harbor Free Trade Zone',
    locations: [
      { name: 'Main Shelving Unit 1', code: 'P-SHELF-01', type: 'Storage' },
      { name: 'Bulk Pallet Bay', code: 'P-PALLET-02', type: 'Storage' },
      { name: 'Inbound Inspection', code: 'P-INSPECT', type: 'Receiving' },
    ],
  });

  for (const loc of warehouse2.locations) {
    await Location.create({ warehouse: warehouse2._id, name: loc.name, code: loc.code, type: loc.type });
  }

  const warehouse3 = await Warehouse.create({
    name: 'Euro Regional Depot',
    code: 'WH-EUROPE',
    address: 'Cargo City Sud, Gate 25, Logistics Hub',
    locations: [
      { name: 'Rack Section North', code: 'EU-NORTH-01', type: 'Storage' },
      { name: 'Express Fulfillment Lane', code: 'EU-EXP-LANE', type: 'Dispatch' },
    ],
  });

  for (const loc of warehouse3.locations) {
    await Location.create({ warehouse: warehouse3._id, name: loc.name, code: loc.code, type: loc.type });
  }

  // 4. Create Products & Initial Inventory
  const productData = [
    {
      sku: 'EL-MCU-001',
      name: 'ARM Cortex-M4 Development Board',
      description: '120MHz 32-bit MCU with DSP & FPU, 512KB Flash',
      categoryId: categories[0]._id,
      uom: 'pcs',
      costPrice: 14.50,
      sellingPrice: 28.00,
      minStock: 25,
      barcode: '8901234567890',
      initialStock: { [warehouse1._id]: 82, [warehouse2._id]: 40, [warehouse3._id]: 20 },
    },
    {
      sku: 'EL-SNS-002',
      name: 'Industrial LiDAR Distance Sensor',
      description: 'Time-of-Flight sensor module up to 12 meters with I2C/UART',
      categoryId: categories[0]._id,
      uom: 'pcs',
      costPrice: 42.00,
      sellingPrice: 79.99,
      minStock: 15,
      barcode: '8901234567891',
      initialStock: { [warehouse1._id]: 7, [warehouse2._id]: 5 },
    },
    {
      sku: 'PWR-BAT-003',
      name: 'LiFePO4 3.2V 5000mAh Cell',
      description: 'High discharge rechargeable lithium iron phosphate battery cell',
      categoryId: categories[3]._id,
      uom: 'pcs',
      costPrice: 6.80,
      sellingPrice: 14.20,
      minStock: 50,
      barcode: '8901234567892',
      initialStock: { [warehouse1._id]: 200, [warehouse2._id]: 100, [warehouse3._id]: 20 },
    },
    {
      sku: 'ENC-ALU-004',
      name: 'Anodized Aluminum IP67 Enclosure',
      description: 'Milled aluminum enclosure with silicone gasket seal',
      categoryId: categories[1]._id,
      uom: 'pcs',
      costPrice: 18.00,
      sellingPrice: 36.50,
      minStock: 20,
      barcode: '8901234567893',
      initialStock: { [warehouse1._id]: 4 },
    },
    {
      sku: 'CBL-USBC-005',
      name: 'Braided USB-C PD 100W Cable (2m)',
      description: 'Heavy duty nylon braided E-marker certified power delivery cable',
      categoryId: categories[4]._id,
      uom: 'pcs',
      costPrice: 3.20,
      sellingPrice: 9.99,
      minStock: 40,
      barcode: '8901234567894',
      initialStock: { [warehouse1._id]: 110, [warehouse2._id]: 70, [warehouse3._id]: 30 },
    },
    {
      sku: 'FST-M3-006',
      name: 'Stainless Steel M3 Hex Standoff Kit',
      description: '300-piece kit: M3 male/female standoffs, screws, and hex nuts',
      categoryId: categories[2]._id,
      uom: 'box',
      costPrice: 8.50,
      sellingPrice: 19.50,
      minStock: 10,
      barcode: '8901234567895',
      initialStock: {},
    },
  ];

  for (const item of productData) {
    const { initialStock, ...pProps } = item;
    const prod = await Product.create({
      ...pProps,
      category: pProps.categoryId,
      createdBy: demoUser._id,
    });

    for (const [wId, qty] of Object.entries(initialStock)) {
      if (qty > 0) {
        await stockService.increaseStock({
          productId: prod._id,
          warehouseId: wId,
          quantity: qty,
          referenceType: 'Initial',
          documentCode: 'INIT-SEED',
          performedBy: demoUser,
          notes: 'Initial opening stock balance',
        });
      }
    }
  }

  console.log('✅ Demo data successfully seeded into MongoDB!');
};

// Standalone execution support
if (process.argv[1]?.endsWith('seed.js')) {
  mongoose
    .connect(env.MONGO_URI)
    .then(async () => {
      await seedDatabase();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

export default seedDatabase;
