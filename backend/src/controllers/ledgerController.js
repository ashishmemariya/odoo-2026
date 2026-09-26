import { getLedgerEntries } from '../services/ledgerService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getLedger = asyncHandler(async (req, res) => {
  const { productId, product, warehouseId, warehouse, locationId, location, type, movementType, search, page, limit, dateFrom, dateTo } = req.query;

  const result = await getLedgerEntries({
    productId: productId || product,
    warehouseId: warehouseId || warehouse,
    locationId: locationId || location,
    type: type || movementType,
    search,
    page,
    limit,
    dateFrom,
    dateTo,
  });

  res.status(200).json({
    success: true,
    data: result.data,
    page: result.page,
    pages: result.pages,
    total: result.total,
  });
});

export default {
  getLedger,
};
