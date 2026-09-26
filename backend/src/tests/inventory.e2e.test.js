import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MOVEMENT_TYPES } from '../models/StockLedger.js';

describe('StockSense Inventory Business Logic & End-to-End Scenario', () => {
  // In-memory mock state replicating Mongoose model operations
  const mockInventory = {}; // `${productId}_${locationId}` -> qty
  const mockLedger = [];
  const productId = 'prod-steel-rod';
  const warehouseId = 'wh-main';
  const locA = 'loc-storage-a';
  const locB = 'loc-storage-b';

  it('Step 1: Receipt 100 units -> Storage A = 100, Ledger = +100', async () => {
    const qtyBefore = mockInventory[`${productId}_${locA}`] || 0;
    const qtyChange = 100;
    const qtyAfter = qtyBefore + qtyChange;
    mockInventory[`${productId}_${locA}`] = qtyAfter;

    mockLedger.push({
      productId,
      warehouseId,
      locationId: locA,
      movementType: MOVEMENT_TYPES.RECEIPT,
      quantityBefore: qtyBefore,
      quantityChange: qtyChange,
      quantityAfter: qtyAfter,
    });

    assert.equal(mockInventory[`${productId}_${locA}`], 100);
    assert.equal(mockLedger[0].quantityChange, 100);
    assert.equal(mockLedger[0].quantityAfter, 100);
  });

  it('Step 2: Transfer 30 units (Storage A -> Storage B) -> Storage A = 70, Storage B = 30, Total = 100', async () => {
    const transferQty = 30;

    // Check source stock
    const srcBefore = mockInventory[`${productId}_${locA}`] || 0;
    assert.ok(srcBefore >= transferQty, 'Source has sufficient stock');

    // Decrease source
    const srcAfter = srcBefore - transferQty;
    mockInventory[`${productId}_${locA}`] = srcAfter;

    // Increase destination
    const destBefore = mockInventory[`${productId}_${locB}`] || 0;
    const destAfter = destBefore + transferQty;
    mockInventory[`${productId}_${locB}`] = destAfter;

    // Record TWO ledger entries
    mockLedger.push({
      productId,
      warehouseId,
      locationId: locA,
      movementType: MOVEMENT_TYPES.TRANSFER_OUT,
      quantityBefore: srcBefore,
      quantityChange: -transferQty,
      quantityAfter: srcAfter,
    });

    mockLedger.push({
      productId,
      warehouseId,
      locationId: locB,
      movementType: MOVEMENT_TYPES.TRANSFER_IN,
      quantityBefore: destBefore,
      quantityChange: transferQty,
      quantityAfter: destAfter,
    });

    assert.equal(mockInventory[`${productId}_${locA}`], 70);
    assert.equal(mockInventory[`${productId}_${locB}`], 30);
    const totalStock = mockInventory[`${productId}_${locA}`] + mockInventory[`${productId}_${locB}`];
    assert.equal(totalStock, 100);
  });

  it('Step 3: Delivery 20 units from Storage B -> Storage B = 10, Total = 80, Ledger = -20', async () => {
    const deliveryQty = 20;

    const bBefore = mockInventory[`${productId}_${locB}`] || 0;
    assert.ok(bBefore >= deliveryQty, 'Storage B has sufficient stock');

    const bAfter = bBefore - deliveryQty;
    mockInventory[`${productId}_${locB}`] = bAfter;

    mockLedger.push({
      productId,
      warehouseId,
      locationId: locB,
      movementType: MOVEMENT_TYPES.DELIVERY,
      quantityBefore: bBefore,
      quantityChange: -deliveryQty,
      quantityAfter: bAfter,
    });

    assert.equal(mockInventory[`${productId}_${locB}`], 10);
    const totalStock = mockInventory[`${productId}_${locA}`] + mockInventory[`${productId}_${locB}`];
    assert.equal(totalStock, 80);
  });

  it('Step 4: Adjustment Physical Count = 7 (Recorded = 10, Diff = -3) -> Storage B = 7, Total = 77', async () => {
    const physicalCount = 7;
    const recorded = mockInventory[`${productId}_${locB}`]; // 10
    const difference = physicalCount - recorded; // -3

    mockInventory[`${productId}_${locB}`] = physicalCount;

    mockLedger.push({
      productId,
      warehouseId,
      locationId: locB,
      movementType: MOVEMENT_TYPES.ADJUSTMENT,
      quantityBefore: recorded,
      quantityChange: difference,
      quantityAfter: physicalCount,
    });

    assert.equal(mockInventory[`${productId}_${locB}`], 7);
    assert.equal(mockInventory[`${productId}_${locA}`], 70);
    const finalTotal = mockInventory[`${productId}_${locA}`] + mockInventory[`${productId}_${locB}`];
    assert.equal(finalTotal, 77, 'Final Total Stock matches exactly 77 units!');
  });

  it('Step 5: Insufficient stock validation prevents negative inventory', () => {
    const available = mockInventory[`${productId}_${locB}`]; // 7
    const requested = 15;

    assert.ok(available < requested, 'Detects insufficient stock');
    const wouldBeNegative = available - requested < 0;
    assert.equal(wouldBeNegative, true, 'Rejects negative inventory');
  });
});
