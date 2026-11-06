/**
 * Driver Custody (عهدة الدليفري) & Shift Reconciliation Utilities
 * Tracks the 10 custody buckets and calculates shift settlement accurately
 */

import { DriverCustodySummary } from '../types/index.ts';
import { roundMoney } from './accounting.ts';

export interface DriverShiftReconciliationInput {
  openingCashCustody: number;
  customerCashCollections: number;
  deliveryFeeCollections: number;
  cashAdvancesReceived: number;
  approvedCashExpenses: number;
  previousCashHandovers: number;
}

/**
 * Calculates the exact expected cash custody held by the driver.
 * Formula:
 * Expected Cash = Opening Custody + Collections (Orders + Delivery Fees) + Advances - Approved Expenses - Previous Handovers
 */
export function calculateExpectedCashCustody(input: DriverShiftReconciliationInput): number {
  const opening = roundMoney(input.openingCashCustody || 0);
  const collections = roundMoney(input.customerCashCollections || 0);
  const deliveryFees = roundMoney(input.deliveryFeeCollections || 0);
  const advances = roundMoney(input.cashAdvancesReceived || 0);
  const expenses = roundMoney(input.approvedCashExpenses || 0);
  const handovers = roundMoney(input.previousCashHandovers || 0);

  // Total collected cash = customer cash collections + delivery fee collections
  const totalCollections = collections + deliveryFees;

  const expected = opening + totalCollections + advances - expenses - handovers;
  return roundMoney(expected);
}

/**
 * Calculates shift closing discrepancy:
 * Discrepancy = Actual Handed Cash - Expected Cash
 * Negative value = Shortage (عجز)
 * Positive value = Surplus (زيادة)
 * Zero = Balanced (مطابق)
 */
export function calculateShiftDiscrepancy(
  expectedCash: number,
  actualCash: number
): {
  discrepancy: number;
  isBalanced: boolean;
  statusTextAr: string;
  statusTextEn: string;
} {
  const exp = roundMoney(expectedCash);
  const act = roundMoney(actualCash);
  const discrepancy = roundMoney(act - exp);

  if (Math.abs(discrepancy) < 0.01) {
    return {
      discrepancy: 0,
      isBalanced: true,
      statusTextAr: 'مطابق تماماً',
      statusTextEn: 'Balanced',
    };
  }

  if (discrepancy < 0) {
    return {
      discrepancy,
      isBalanced: false,
      statusTextAr: `عجز قدره ${Math.abs(discrepancy)} ج.م`,
      statusTextEn: `Shortage of ${Math.abs(discrepancy)} EGP`,
    };
  }

  return {
    discrepancy,
    isBalanced: false,
    statusTextAr: `زيادة قدرها ${discrepancy} ج.م`,
    statusTextEn: `Surplus of ${discrepancy} EGP`,
  };
}
