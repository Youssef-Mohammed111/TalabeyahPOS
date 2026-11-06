/**
 * Inventory Costing and Profit Utilities
 * Uses moving weighted-average costing as specified in the business directive
 */

import { roundMoney } from './accounting.ts';

/**
 * Calculates the new moving weighted-average unit cost when receiving incoming stock.
 * Formula: (Current Physical Stock * Current Cost + Incoming Qty * Incoming Cost) / (Current Stock + Incoming Qty)
 *
 * If current stock is 0 or negative, the incoming cost becomes the new cost.
 */
export function calculateMovingWeightedAverageCost(
  currentStock: number,
  currentCost: number,
  incomingQty: number,
  incomingCost: number
): number {
  if (incomingQty <= 0) {
    return roundMoney(currentCost);
  }

  // If previous stock is non-positive, newly received goods establish the new cost
  if (currentStock <= 0) {
    return roundMoney(incomingCost);
  }

  const currentValue = currentStock * currentCost;
  const incomingValue = incomingQty * incomingCost;
  const totalStock = currentStock + incomingQty;

  const newAverage = (currentValue + incomingValue) / totalStock;
  return roundMoney(newAverage);
}

/**
 * Calculates gross profit for a line item or sale.
 * Line Profit = Total Revenue - (Sold Quantity * Unit Cost)
 */
export function calculateLineProfit(
  quantity: number,
  unitSellingPrice: number,
  unitCostPrice: number,
  lineDiscount: number = 0
): {
  revenue: number;
  cost: number;
  grossProfit: number;
  marginPercent: number;
} {
  const revenue = roundMoney(quantity * unitSellingPrice - lineDiscount);
  const cost = roundMoney(quantity * unitCostPrice);
  const grossProfit = roundMoney(revenue - cost);
  const marginPercent = revenue > 0 ? roundMoney((grossProfit / revenue) * 100) : 0;

  return { revenue, cost, grossProfit, marginPercent };
}
