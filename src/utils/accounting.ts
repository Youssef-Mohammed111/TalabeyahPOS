/**
 * Financial and Currency Calculation Utilities
 * Ensures decimal-safe arithmetic for money in EGP
 */

/**
 * Rounds a monetary amount to 2 decimal places to prevent floating-point inaccuracies
 */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Adds two or more currency values safely
 */
export function addMoney(...amounts: number[]): number {
  return amounts.reduce((acc, curr) => roundMoney(acc + curr), 0);
}

/**
 * Subtracts currency values safely
 */
export function subtractMoney(base: number, ...subtractions: number[]): number {
  return subtractions.reduce((acc, curr) => roundMoney(acc - curr), base);
}

/**
 * Multiplies quantity and unit price with precision
 */
export function multiplyMoney(quantity: number, unitPrice: number): number {
  return roundMoney(quantity * unitPrice);
}

/**
 * Formats monetary amounts in EGP for Arabic or English
 */
export function formatMoney(amount: number, locale: 'ar' | 'en' = 'ar'): string {
  const rounded = roundMoney(amount);
  const formatted = rounded.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return locale === 'ar' ? `${formatted} ج.م` : `${formatted} EGP`;
}

/**
 * Calculates cart or invoice totals
 */
export function calculateInvoiceTotals(params: {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  taxRate?: number;
}): {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  tax: number;
  total: number;
} {
  const subtotal = roundMoney(params.subtotal);
  const discount = Math.min(subtotal, roundMoney(params.discount || 0));
  const deliveryFee = roundMoney(params.deliveryFee || 0);
  const taxableAmount = roundMoney(subtotal - discount);
  const taxRate = params.taxRate || 0;
  const tax = roundMoney(taxableAmount * taxRate);
  const total = roundMoney(taxableAmount + tax + deliveryFee);

  return { subtotal, discount, taxableAmount, tax, total };
}
