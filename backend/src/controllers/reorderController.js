import ReorderRule from '../models/ReorderRule.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getReorderRules = asyncHandler(async (req, res) => {
  const rules = await ReorderRule.find({ active: true })
    .populate('product', 'name sku uom totalStock minStock')
    .populate('warehouse', 'name code')
    .populate('location', 'name code');

  res.status(200).json({ success: true, data: rules });
});

export const createReorderRule = asyncHandler(async (req, res) => {
  const { product, warehouse, location, minimumQuantity, reorderQuantity } = req.body;

  if (!product || !warehouse) {
    return res.status(400).json({ success: false, message: 'Product and warehouse are required' });
  }

  const existing = await ReorderRule.findOne({ product, warehouse });
  if (existing) {
    return res.status(400).json({ success: false, message: 'A reorder rule already exists for this product and warehouse' });
  }

  const rule = await ReorderRule.create({
    product,
    warehouse,
    location,
    minimumQuantity: Number(minimumQuantity) || 10,
    reorderQuantity: Number(reorderQuantity) || 50,
  });

  const populated = await ReorderRule.findById(rule._id)
    .populate('product', 'name sku')
    .populate('warehouse', 'name code');

  res.status(201).json({ success: true, message: 'Reorder rule created', data: populated });
});

export const updateReorderRule = asyncHandler(async (req, res) => {
  const rule = await ReorderRule.findById(req.params.id);
  if (!rule) {
    return res.status(404).json({ success: false, message: 'Reorder rule not found' });
  }

  const { minimumQuantity, reorderQuantity, active } = req.body;
  if (minimumQuantity !== undefined) rule.minimumQuantity = Number(minimumQuantity);
  if (reorderQuantity !== undefined) rule.reorderQuantity = Number(reorderQuantity);
  if (active !== undefined) rule.active = active;

  await rule.save();
  res.status(200).json({ success: true, message: 'Reorder rule updated', data: rule });
});

export const deleteReorderRule = asyncHandler(async (req, res) => {
  const rule = await ReorderRule.findById(req.params.id);
  if (!rule) {
    return res.status(404).json({ success: false, message: 'Reorder rule not found' });
  }

  await ReorderRule.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Reorder rule deleted' });
});

export default {
  getReorderRules,
  createReorderRule,
  updateReorderRule,
  deleteReorderRule,
};
