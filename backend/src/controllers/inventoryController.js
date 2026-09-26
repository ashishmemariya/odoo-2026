import Inventory from '../models/Inventory.js';
import stockService from '../services/stockService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getInventory = asyncHandler(async (req, res) => {
  const { product, warehouse, location } = req.query;

  const query = {};
  if (product) query.product = product;
  if (warehouse) query.warehouse = warehouse;
  if (location) query.location = location;

  const inventory = await Inventory.find(query)
    .populate('product', 'name sku uom costPrice sellingPrice minStock')
    .populate('warehouse', 'name code')
    .populate('location', 'name code type')
    .sort({ quantity: -1 });

  res.status(200).json({ success: true, data: inventory });
});

export const getProductInventory = asyncHandler(async (req, res) => {
  const stockInfo = await stockService.getProductStock(req.params.productId);
  res.status(200).json({ success: true, data: stockInfo });
});

export const getLocationInventory = asyncHandler(async (req, res) => {
  const inventory = await stockService.getLocationStock(req.params.locationId);
  res.status(200).json({ success: true, data: inventory });
});

export const getWarehouseInventory = asyncHandler(async (req, res) => {
  const inventory = await stockService.getWarehouseStock(req.params.warehouseId);
  res.status(200).json({ success: true, data: inventory });
});

export default {
  getInventory,
  getProductInventory,
  getLocationInventory,
  getWarehouseInventory,
};
