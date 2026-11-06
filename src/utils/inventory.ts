/**
 * Inventory Stock Calculation and Unit Conversion Utilities
 */

import { InventoryStock, UnitType } from '../types/index.ts';

/**
 * Calculates available stock according to the formula:
 * available = physicalQty - reservedQty - inTransitQty - damagedQty - awaitingInspectionQty
 */
export function calculateAvailableStock(stock: InventoryStock): number {
  const available =
    stock.physicalQty -
    (stock.reservedQty || 0) -
    (stock.inTransitQty || 0) -
    (stock.damagedQty || 0) -
    (stock.awaitingInspectionQty || 0);

  return Math.max(0, Math.round(available * 1000) / 1000);
}

/**
 * Validates whether stock is sufficient for an order/sale
 */
export function hasSufficientStock(stock: InventoryStock, requestedQty: number): boolean {
  return calculateAvailableStock(stock) >= requestedQty;
}

/**
 * Converts quantity between units
 */
export function convertUnitQuantity(
  qty: number,
  fromUnit: UnitType,
  toUnit: UnitType
): number {
  if (fromUnit === toUnit) return qty;

  // Kilogram <-> Gram
  if (fromUnit === 'kg' && toUnit === 'g') return Math.round(qty * 1000);
  if (fromUnit === 'g' && toUnit === 'kg') return Math.round(qty / 1000 * 1000) / 1000;

  // Other units default 1:1 if custom conversion is not defined
  return qty;
}

/**
 * Formats quantity with unit display
 */
export function formatQuantityWithUnit(
  qty: number,
  unit: UnitType,
  locale: 'ar' | 'en' = 'ar'
): string {
  const unitLabelsAr: Record<UnitType, string> = {
    kg: 'كجم',
    g: 'جرام',
    piece: 'قطعة',
    box: 'صندوق',
    carton: 'كرتونة',
    pack: 'عبوة',
    liter: 'لتر',
  };

  const unitLabelsEn: Record<UnitType, string> = {
    kg: 'kg',
    g: 'g',
    piece: 'pcs',
    box: 'box',
    carton: 'carton',
    pack: 'pack',
    liter: 'L',
  };

  const unitStr = locale === 'ar' ? unitLabelsAr[unit] || unit : unitLabelsEn[unit] || unit;
  return `${qty} ${unitStr}`;
}
