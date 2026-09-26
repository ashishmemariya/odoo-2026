import Adjustment from '../models/Adjustment.js';
import stockService from '../services/stockService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAdjustments = asyncHandler(async (req, res) => {
  const { search, status, warehouseId } = req.query;

  const query = {};
  if (status && status !== 'ALL') {
    query.status = status;
  }
  if (warehouseId && warehouseId !== 'ALL') {
    query.$or = [{ warehouseId }, { warehouse: warehouseId }];
  }
  if (search) {
    query.$or = [
      { code: new RegExp(search, 'i') },
      { adjustmentNumber: new RegExp(search, 'i') },
      { reason: new RegExp(search, 'i') },
    ];
  }

  const adjustments = await Adjustment.find(query)
    .populate('warehouseId', 'name code')
    .populate('warehouse', 'name code')
    .populate('locationId', 'name code type')
    .populate('lines.productId', 'name sku uom totalStock costPrice')
    .populate('items.productId', 'name sku uom totalStock costPrice')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: adjustments });
});

export const getAdjustmentById = asyncHandler(async (req, res) => {
  const adjustment = await Adjustment.findById(req.params.id)
    .populate('warehouseId', 'name code')
    .populate('warehouse', 'name code')
    .populate('locationId', 'name code type')
    .populate('lines.productId', 'name sku uom totalStock costPrice')
    .populate('items.productId', 'name sku uom totalStock costPrice');

  if (!adjustment) {
    return res.status(404).json({ success: false, message: 'Adjustment not found' });
  }

  res.status(200).json({ success: true, data: adjustment });
});

export const createAdjustment = asyncHandler(async (req, res) => {
  const { code, adjustmentNumber, warehouseId, warehouse, locationId, location, reason, lines, items, notes } = req.body;

  const finalCode = (code || adjustmentNumber || `ADJ-${Date.now()}`).trim().toUpperCase();
  const targetWarehouse = warehouseId || warehouse;
  const rawLines = lines || items || [];

  if (!targetWarehouse || !reason) {
    return res.status(400).json({ success: false, message: 'Warehouse and reason are required' });
  }

  const existing = await Adjustment.findOne({ $or: [{ code: finalCode }, { adjustmentNumber: finalCode }] });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Adjustment code already exists' });
  }

  // Calculate true differences on the backend
  const sanitizedLines = rawLines.map((line) => {
    const sys = Number(line.systemQty !== undefined ? line.systemQty : (line.recordedQuantity || 0));
    const counted = Number(line.countedQty !== undefined ? line.countedQty : (line.physicalQuantity || 0));
    const diff = counted - sys;
    return {
      productId: line.productId || line.product,
      product: line.productId || line.product,
      systemQty: sys,
      recordedQuantity: sys,
      countedQty: counted,
      physicalQuantity: counted,
      difference: diff,
    };
  });

  const adjustment = await Adjustment.create({
    code: finalCode,
    adjustmentNumber: finalCode,
    warehouseId: targetWarehouse,
    warehouse: targetWarehouse,
    locationId: locationId || location,
    reason: reason.trim(),
    lines: sanitizedLines,
    items: sanitizedLines,
    status: 'Draft',
    notes: notes || '',
    createdBy: req.user?._id,
  });

  const populated = await Adjustment.findById(adjustment._id)
    .populate('warehouseId', 'name code')
    .populate('lines.productId', 'name sku uom');

  res.status(201).json({ success: true, message: 'Adjustment created successfully', data: populated });
});

export const updateAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await Adjustment.findById(req.params.id);
  if (!adjustment) {
    return res.status(404).json({ success: false, message: 'Adjustment not found' });
  }

  if (adjustment.status === 'Done' || adjustment.status === 'DONE') {
    return res.status(400).json({ success: false, message: 'Completed adjustments cannot be modified' });
  }

  const { warehouseId, warehouse, locationId, reason, lines, items, notes } = req.body;
  if (warehouseId || warehouse) {
    adjustment.warehouseId = warehouseId || warehouse;
    adjustment.warehouse = warehouseId || warehouse;
  }
  if (locationId !== undefined) adjustment.locationId = locationId;
  if (reason) adjustment.reason = reason.trim();
  if (notes !== undefined) adjustment.notes = notes;

  if (lines || items) {
    const rawLines = lines || items;
    adjustment.lines = rawLines.map((line) => {
      const sys = Number(line.systemQty !== undefined ? line.systemQty : (line.recordedQuantity || 0));
      const counted = Number(line.countedQty !== undefined ? line.countedQty : (line.physicalQuantity || 0));
      return {
        productId: line.productId || line.product,
        product: line.productId || line.product,
        systemQty: sys,
        recordedQuantity: sys,
        countedQty: counted,
        physicalQuantity: counted,
        difference: counted - sys,
      };
    });
    adjustment.items = adjustment.lines;
  }

  await adjustment.save();
  const populated = await Adjustment.findById(adjustment._id)
    .populate('warehouseId', 'name code')
    .populate('lines.productId', 'name sku uom');

  res.status(200).json({ success: true, message: 'Adjustment updated successfully', data: populated });
});

/**
 * Validate Adjustment.
 * Adjusts inventory to physical count and records Ledger entry with computed difference.
 */
export const validateAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await Adjustment.findById(req.params.id);
  if (!adjustment) {
    return res.status(404).json({ success: false, message: 'Adjustment not found' });
  }

  if (adjustment.status === 'Done' || adjustment.status === 'DONE') {
    return res.status(400).json({
      success: false,
      message: 'Adjustment has already been validated and applied.',
    });
  }

  if (adjustment.status === 'Canceled' || adjustment.status === 'CANCELED') {
    return res.status(400).json({
      success: false,
      message: 'Cannot validate a canceled adjustment',
    });
  }

  const lines = adjustment.lines && adjustment.lines.length ? adjustment.lines : adjustment.items;
  if (!lines || lines.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot validate an adjustment with no items',
    });
  }

  const whId = (adjustment.warehouseId?._id || adjustment.warehouseId || adjustment.warehouse).toString();

  for (const line of lines) {
    const pId = line.productId?._id || line.productId || line.product?._id || line.product;
    const counted = Number(line.countedQty !== undefined ? line.countedQty : (line.physicalQuantity || 0));
    const sys = Number(line.systemQty !== undefined ? line.systemQty : (line.recordedQuantity || 0));

    await stockService.adjustStock({
      productId: pId,
      warehouseId: whId,
      locationId: adjustment.locationId || adjustment.location,
      countedQuantity: counted,
      systemQuantity: sys,
      referenceType: 'Adjustment',
      referenceId: adjustment._id,
      documentCode: adjustment.code || adjustment.adjustmentNumber,
      performedBy: req.user,
      notes: `${adjustment.reason} ${adjustment.notes ? `(${adjustment.notes})` : ''}`,
    });
  }

  adjustment.status = 'Done';
  adjustment.validatedBy = req.user?._id;
  adjustment.validatedAt = new Date();
  await adjustment.save();

  const populated = await Adjustment.findById(adjustment._id)
    .populate('warehouseId', 'name code')
    .populate('lines.productId', 'name sku uom');

  res.status(200).json({
    success: true,
    message: 'Stock adjustment applied and ledger updated successfully',
    data: populated,
  });
});

export const cancelAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await Adjustment.findById(req.params.id);
  if (!adjustment) {
    return res.status(404).json({ success: false, message: 'Adjustment not found' });
  }

  if (adjustment.status === 'Done' || adjustment.status === 'DONE') {
    return res.status(400).json({ success: false, message: 'Cannot cancel a completed adjustment' });
  }

  adjustment.status = 'Canceled';
  await adjustment.save();

  res.status(200).json({ success: true, message: 'Adjustment canceled', data: adjustment });
});

export default {
  getAdjustments,
  getAdjustmentById,
  createAdjustment,
  updateAdjustment,
  validateAdjustment,
  cancelAdjustment,
};
