import dashboardService from '../services/dashboardService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const metrics = await dashboardService.getDashboardMetrics(req.query);
  res.status(200).json({
    success: true,
    data: metrics,
  });
});

export default {
  getDashboardSummary,
};
