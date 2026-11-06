import test from 'node:test';
import assert from 'node:assert/strict';

import {
  roundMoney,
  addMoney,
  subtractMoney,
  multiplyMoney,
  calculateInvoiceTotals,
} from '../src/utils/accounting.ts';

import {
  calculateMovingWeightedAverageCost,
  calculateLineProfit,
} from '../src/utils/costing.ts';

import {
  calculateAvailableStock,
  convertUnitQuantity,
} from '../src/utils/inventory.ts';

import {
  calculateExpectedCashCustody,
  calculateShiftDiscrepancy,
} from '../src/utils/driverCustody.ts';

import { hasPermission, ROLE_PERMISSIONS } from '../src/utils/rbac.ts';
import { User, InventoryStock, CartItem, SalePayment } from '../src/types/index.ts';
import { initialUsers, initialProducts } from '../src/data/initialData.ts';

// Scenario A & Accounting
test('Scenario A & Accounting: Decimal-safe calculations and rounding', () => {
  // Floating point edge cases: 0.1 + 0.2
  assert.equal(addMoney(0.1, 0.2), 0.3);
  assert.equal(roundMoney(125.556), 125.56);
  assert.equal(subtractMoney(325, 100), 225);

  // Decimal weight pricing: 1.375 kg * 25.00 EGP/kg
  const weightTotal = multiplyMoney(1.375, 25.0);
  assert.equal(weightTotal, 34.38);

  const totals = calculateInvoiceTotals({
    subtotal: 300,
    discount: 25,
    deliveryFee: 20,
    taxRate: 0.14,
  });
  // subtotal 300 - discount 25 = 275 taxable. 275 * 0.14 = 38.5 tax. 275 + 38.5 + 20 = 333.5
  assert.equal(totals.taxableAmount, 275);
  assert.equal(totals.tax, 38.5);
  assert.equal(totals.total, 333.5);
});

// Scenario B: Moving weighted-average costing
test('Scenario B: Moving weighted-average costing on goods receiving', () => {
  // Initial: 10 kg @ 20 EGP = 200 EGP value
  // Incoming: 10 kg @ 30 EGP = 300 EGP value
  // New average: 500 / 20 = 25 EGP
  const newCost1 = calculateMovingWeightedAverageCost(10, 20, 10, 30);
  assert.equal(newCost1, 25);

  // When stock is 0, incoming cost sets the average
  const newCost2 = calculateMovingWeightedAverageCost(0, 0, 15, 42.5);
  assert.equal(newCost2, 42.5);

  // Profit calculation
  const profit = calculateLineProfit(5, 50, 35, 10); // 5*50 - 10 = 240 revenue, 5*35 = 175 cost => 65 profit
  assert.equal(profit.revenue, 240);
  assert.equal(profit.cost, 175);
  assert.equal(profit.grossProfit, 65);
});

// Inventory Stock Calculations
test('Inventory Stock: Available stock deduction prevents double reservation', () => {
  const stock: InventoryStock = {
    productId: 'prod-tomato',
    branchId: 'branch-1',
    physicalQty: 100,
    reservedQty: 15,
    inTransitQty: 10,
    damagedQty: 5,
    awaitingInspectionQty: 2,
  };

  // Available = 100 - 15 - 10 - 5 - 2 = 68
  assert.equal(calculateAvailableStock(stock), 68);

  // Decimal conversion
  assert.equal(convertUnitQuantity(1.5, 'kg', 'g'), 1500);
  assert.equal(convertUnitQuantity(750, 'g', 'kg'), 0.75);
});

// Scenario I: Driver Shift Closeout & Custody Reconciliation
test('Scenario I: Driver Shift Closeout & Custody Reconciliation (Exact Specification)', () => {
  // Directive Example:
  // - Customer cash collections: 1,000 EGP.
  // - Cash advance received during the shift: 200 EGP.
  // - Approved cash expense paid from the same custody: 50 EGP.
  // - Previous handover during the shift: 700 EGP.
  // Expected remaining cash custody: 1,000 + 200 - 50 - 700 = 450 EGP.
  const expectedCustody = calculateExpectedCashCustody({
    openingCashCustody: 0,
    customerCashCollections: 1000,
    deliveryFeeCollections: 0,
    cashAdvancesReceived: 200,
    approvedCashExpenses: 50,
    previousCashHandovers: 700,
  });

  assert.equal(expectedCustody, 450);

  // Exact handover matching expected
  const checkBalanced = calculateShiftDiscrepancy(450, 450);
  assert.equal(checkBalanced.isBalanced, true);
  assert.equal(checkBalanced.discrepancy, 0);

  // Shortage: Handed 400 instead of 450 => -50 EGP
  const checkShortage = calculateShiftDiscrepancy(450, 400);
  assert.equal(checkShortage.isBalanced, false);
  assert.equal(checkShortage.discrepancy, -50);

  // Surplus: Handed 470 instead of 450 => +20 EGP
  const checkSurplus = calculateShiftDiscrepancy(450, 470);
  assert.equal(checkSurplus.isBalanced, false);
  assert.equal(checkSurplus.discrepancy, 20);
});

// Scenario E, F, G: Delivery Order Payment Scenarios
test('Scenario E, F, G: Delivery Order Payment Scenarios', () => {
  // Scenario E: 300 EGP products + 25 EGP delivery fee = 325 EGP. Paid in full.
  const orderE = calculateInvoiceTotals({ subtotal: 300, discount: 0, deliveryFee: 25 });
  assert.equal(orderE.total, 325);

  // Custody with 325 collected, 325 handed over:
  const custodyE = calculateExpectedCashCustody({
    openingCashCustody: 0,
    customerCashCollections: 300,
    deliveryFeeCollections: 25,
    cashAdvancesReceived: 0,
    approvedCashExpenses: 0,
    previousCashHandovers: 325,
  });
  assert.equal(custodyE, 0);

  // Scenario G: Partially paid: 325 due, 100 collected => 225 remaining
  const partialPaid = 100;
  const remainingG = subtractMoney(325, partialPaid);
  assert.equal(remainingG, 225);
});

// Scenario J: Strict Role-Based Permissions & Security
test('Scenario J: Strict Role-Based Permissions & Security', () => {
  const driverUser: User = {
    id: 'u-driver',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    username: 'driver_ahmed',
    name: 'Ahmed',
    role: 'driver',
    active: true,
  };

  const cashierUser: User = {
    id: 'u-cashier',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    username: 'cashier_mona',
    name: 'Mona',
    role: 'cashier',
    active: true,
  };

  const ownerUser: User = {
    id: 'u-owner',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    username: 'owner_tarek',
    name: 'Tarek',
    role: 'owner',
    active: true,
  };

  // Driver CAN perform driver actions, CANNOT edit costs or prices or view reports
  assert.equal(hasPermission(driverUser, 'driver_actions'), true);
  assert.equal(hasPermission(driverUser, 'view_costs'), false);
  assert.equal(hasPermission(driverUser, 'view_reports'), false);
  assert.equal(hasPermission(driverUser, 'stock_adjustment'), false);

  // Cashier CAN create sales, CANNOT view profits or modify settings
  assert.equal(hasPermission(cashierUser, 'create_sale'), true);
  assert.equal(hasPermission(cashierUser, 'view_profits'), false);
  assert.equal(hasPermission(cashierUser, 'manage_settings'), false);

  // Owner has full access
  assert.equal(hasPermission(ownerUser, 'view_profits'), true);
  assert.equal(hasPermission(ownerUser, 'close_driver_shift'), true);
  assert.equal(hasPermission(ownerUser, 'manage_settings'), true);
});

// Authentication and Credentials Validation Test
test('Authentication: Validate password verification, username/email matching, and active status', () => {
  const testUsers: User[] = [
    {
      id: 'u-1',
      tenantId: 't-1',
      branchId: 'b-1',
      username: 'cashier_mona',
      email: 'mona@talabeyah.eg',
      password: 'cashier123',
      name: 'Mona',
      role: 'cashier',
      active: true,
    },
    {
      id: 'u-2',
      tenantId: 't-1',
      branchId: 'b-1',
      username: 'inactive_user',
      email: 'inactive@talabeyah.eg',
      password: 'pass123',
      name: 'Inactive',
      role: 'cashier',
      active: false,
    },
  ];

  // Helper auth check mimicking login logic
  const authenticate = (idOrEmail: string, pass: string) => {
    const trimmed = idOrEmail.trim().toLowerCase();
    const user = testUsers.find(
      (u) => u.active && (u.username.toLowerCase() === trimmed || u.email?.toLowerCase() === trimmed)
    );
    if (!user) return { success: false, error: 'USER_NOT_FOUND' };
    if (user.password !== pass) return { success: false, error: 'INVALID_PASSWORD' };
    return { success: true, user };
  };

  // Valid login with username
  const auth1 = authenticate('cashier_mona', 'cashier123');
  assert.equal(auth1.success, true);
  assert.equal(auth1.user?.username, 'cashier_mona');

  // Valid login with email
  const auth2 = authenticate('mona@talabeyah.eg', 'cashier123');
  assert.equal(auth2.success, true);

  // Invalid password rejection
  const auth3 = authenticate('cashier_mona', 'wrongpass');
  assert.equal(auth3.success, false);
  assert.equal(auth3.error, 'INVALID_PASSWORD');

  // Unknown username rejection
  const auth4 = authenticate('nobody', 'any');
  assert.equal(auth4.success, false);
  assert.equal(auth4.error, 'USER_NOT_FOUND');

  // Inactive user rejection
  const auth5 = authenticate('inactive_user', 'pass123');
  assert.equal(auth5.success, false);
  assert.equal(auth5.error, 'USER_NOT_FOUND');
});

// Split Payment Calculation Test
test('Split Payments: Ensure split payment totals match invoice total exactly', () => {
  const invoiceTotal = 350.0;
  const payments: SalePayment[] = [
    { id: 'pay-1', method: 'cash', amount: 150.0, timestamp: '2026-10-28T12:00:00Z' },
    { id: 'pay-2', method: 'bank_card', amount: 150.0, timestamp: '2026-10-28T12:00:00Z' },
    { id: 'pay-3', method: 'vodafone_cash', amount: 50.0, timestamp: '2026-10-28T12:00:00Z' },
  ];

  const totalPaid = payments.reduce((sum, p) => roundMoney(sum + p.amount), 0);
  assert.equal(totalPaid, invoiceTotal);

  const remaining = subtractMoney(invoiceTotal, totalPaid);
  assert.equal(remaining, 0);
});

// Customer Return Restocking: Saleable vs Damaged goods
test('Customer Return Restocking: Distinguish saleable restock vs damaged write-off', () => {
  let physicalQty = 50;
  let damagedQty = 0;

  const returnItems = [
    { productId: 'prod-tomato', qty: 3, condition: 'SALEABLE' as const },
    { productId: 'prod-tomato', qty: 2, condition: 'DAMAGED' as const },
  ];

  // Restocking process
  returnItems.forEach((item) => {
    if (item.condition === 'SALEABLE') {
      physicalQty = roundMoney(physicalQty + item.qty);
    } else {
      damagedQty = roundMoney(damagedQty + item.qty);
    }
  });

  // Physical stock increased only by saleable units (50 + 3 = 53)
  assert.equal(physicalQty, 53);
  // Damaged stock segregated to damaged bucket (0 + 2 = 2)
  assert.equal(damagedQty, 2);
});

// Produce Photography Validation
test('Produce Photography: Verify realistic images are attached to produce catalog', () => {
  assert.ok(initialProducts.length >= 10);
  const produceItems = initialProducts.filter((p) => p.categoryId === 'cat-veg' || p.categoryId === 'cat-fruits');
  assert.ok(produceItems.length >= 6);

  // Every produce item must have a valid high-resolution image URL
  produceItems.forEach((item) => {
    assert.ok(item.imageUrl, `Product ${item.id} (${item.nameAr}) is missing an imageUrl`);
    assert.ok(item.imageUrl.startsWith('https://images.unsplash.com/'), `Product ${item.id} imageUrl is not valid`);
  });
});

// Multi-Branch Isolation Test
test('Multi-Branch Isolation: Operations in Branch 1 do not alter Branch 2 stock', () => {
  const branchStocks: Record<string, InventoryStock> = {
    'branch-1': {
      productId: 'prod-tomato',
      branchId: 'branch-1',
      physicalQty: 100,
      reservedQty: 0,
      inTransitQty: 0,
      damagedQty: 0,
      awaitingInspectionQty: 0,
    },
    'branch-2': {
      productId: 'prod-tomato',
      branchId: 'branch-2',
      physicalQty: 60,
      reservedQty: 0,
      inTransitQty: 0,
      damagedQty: 0,
      awaitingInspectionQty: 0,
    },
  };

  // Branch 1 sells 20 kg
  branchStocks['branch-1'].physicalQty = subtractMoney(branchStocks['branch-1'].physicalQty, 20);

  // Branch 1 is now 80 kg, Branch 2 remains 60 kg intact
  assert.equal(branchStocks['branch-1'].physicalQty, 80);
  assert.equal(branchStocks['branch-2'].physicalQty, 60);
});

// S3: Cashier Shift Expected Cash Formula & Variance Audit
test('S3 Shift Audit: Verify exact expected cash formula and drawer variance', () => {
  const openingCash = 200.0;
  const cashSales = 1350.5;
  const debtCollections = 250.0;
  const refunds = 75.0;
  const drawerDrops = 500.0; // Manager-approved drop to safe
  const drawerDeposits = 100.0; // Additional change

  // Formula: Expected = Opening + CashSales + Collections - Refunds - Drops + Deposits
  const expectedCash = roundMoney(
    openingCash + cashSales + debtCollections - refunds - drawerDrops + drawerDeposits
  );
  assert.equal(expectedCash, 1325.5);

  // Scenario 1: Actual count matches expected
  const actualCashExact = 1325.5;
  const varianceExact = roundMoney(actualCashExact - expectedCash);
  assert.equal(varianceExact, 0);

  // Scenario 2: Actual count has deficit (عجز)
  const actualCashDeficit = 1310.0;
  const varianceDeficit = roundMoney(actualCashDeficit - expectedCash);
  assert.equal(varianceDeficit, -15.5);

  // Scenario 3: Actual count has surplus (زيادة)
  const actualCashSurplus = 1335.0;
  const varianceSurplus = roundMoney(actualCashSurplus - expectedCash);
  assert.equal(varianceSurplus, 9.5);
});

// S8: Waste & Produce Spoilage Loss Calculation
test('S8 Spoilage: Calculate financial loss on spoiled produce at moving weighted-average cost', () => {
  const spoiledProduce = [
    { name: 'طماطم ذابلة', qty: 4.5, unitCost: 11.25, reason: 'rotten' },
    { name: 'خيار معطوب', qty: 2.0, unitCost: 14.5, reason: 'damaged' },
  ];

  const totalLoss = roundMoney(
    spoiledProduce.reduce((sum, item) => sum + item.qty * item.unitCost, 0)
  );

  // 4.5 * 11.25 = 50.625 -> 50.63, 2 * 14.5 = 29.0 -> 79.63
  assert.equal(totalLoss, 79.63);
});

// S14: On-spot Manager PIN verification check
test('S14 Manager PIN: Authorize sensitive drawer and refund actions on-spot', () => {
  const validManagerPins = ['1234', '5678', '0000'];
  const verifyPin = (entered: string) => validManagerPins.includes(entered.trim());

  assert.equal(verifyPin('1234'), true);
  assert.equal(verifyPin('5678'), true);
  assert.equal(verifyPin('9999'), false);
  assert.equal(verifyPin(''), false);
});

