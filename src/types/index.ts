/**
 * Talabeyah POS - Core Type Definitions
 * Multi-tenant, Multi-branch, Retail, Inventory, Delivery & Driver Custody
 */

export type RoleType =
  | 'super_admin'
  | 'owner'
  | 'manager'
  | 'cashier'
  | 'inventory'
  | 'purchasing'
  | 'dispatcher'
  | 'driver'
  | 'accountant'
  | 'custom';

export type Permission =
  | 'view_dashboard'
  | 'view_pos'
  | 'create_sale'
  | 'void_sale'
  | 'apply_discount'
  | 'view_costs'
  | 'view_profits'
  | 'manage_products'
  | 'manage_inventory'
  | 'stock_adjustment'
  | 'receive_goods'
  | 'supplier_return'
  | 'customer_return'
  | 'manage_delivery'
  | 'dispatch_order'
  | 'driver_actions'
  | 'manage_custody'
  | 'close_driver_shift'
  | 'manage_cashbox'
  | 'approve_expenses'
  | 'approve_discrepancies'
  | 'view_reports'
  | 'export_data'
  | 'manage_users'
  | 'manage_settings';

export interface User {
  id: string;
  tenantId: string;
  branchId: string;
  assignedBranches?: string[];
  username: string;
  email?: string;
  password?: string;
  passwordHash?: string;
  name: string;
  role: RoleType;
  phone?: string;
  active: boolean;
  customPermissions?: Permission[];
}

export interface Tenant {
  id: string;
  nameAr: string;
  nameEn: string;
  plan: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended';
  currency: string; // 'EGP'
  createdAt: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  nameAr: string;
  nameEn: string;
  code: string;
  phone: string;
  address: string;
  active: boolean;
}

export type UnitType = 'kg' | 'g' | 'piece' | 'box' | 'carton' | 'pack' | 'liter';

export interface Category {
  id: string;
  tenantId: string;
  nameAr: string;
  nameEn: string;
  code: string;
  icon?: string;
  imageUrl?: string;
  color?: string;
}

export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  barcode: string;
  nameAr: string;
  nameEn: string;
  categoryId: string;
  purchaseCost: number; // Moving weighted average cost
  sellingPrice: number;
  minSellingPrice?: number;
  baseUnit: UnitType;
  weightBased: boolean;
  minStock: number;
  active: boolean;
  trackStock: boolean;
  supplierId?: string;
  imageUrl?: string;
  notes?: string;
}

export interface InventoryStock {
  productId: string;
  branchId: string;
  physicalQty: number;      // Total physical goods in store
  reservedQty: number;      // Pending delivery orders not yet dispatched
  inTransitQty: number;     // Currently with drivers
  damagedQty: number;       // Spoiled/damaged goods
  awaitingInspectionQty: number; // Returns pending QA
}

export type MovementType =
  | 'PURCHASE_RECEIPT'
  | 'SALE'
  | 'SALE_RETURN_RESTOCK'
  | 'SUPPLIER_RETURN'
  | 'DISPATCH_TO_DRIVER'
  | 'DRIVER_RETURN_RESTOCK'
  | 'DAMAGE_WRITEOFF'
  | 'STOCK_ADJUSTMENT'
  | 'BRANCH_TRANSFER';

export interface InventoryMovement {
  id: string;
  tenantId: string;
  branchId: string;
  productId: string;
  movementType: MovementType;
  quantity: number; // positive = added to physical stock, negative = deducted
  unit: UnitType;
  unitCost: number;
  referenceId: string;
  reason?: string;
  performedBy: string;
  timestamp: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  address?: string;
  zoneId?: string;
  openingBalance: number;
  outstandingBalance: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  address?: string;
  openingBalance: number;
  payableBalance: number; // What we owe the supplier
  notes?: string;
}

export type PaymentMethod =
  | 'cash'
  | 'bank_card'
  | 'vodafone_cash'
  | 'instapay'
  | 'customer_credit'
  | 'bank_transfer';

export interface SalePayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  timestamp: string;
}

export interface CartItem {
  productId: string;
  productNameAr: string;
  productNameEn: string;
  sku: string;
  barcode: string;
  weightBased: boolean;
  unit: UnitType;
  quantity: number; // Decimal supported e.g. 1.375 kg
  unitPrice: number;
  purchaseCost: number;
  discount: number; // Line discount in EGP
  total: number;
  imageUrl?: string;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  branchId: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  payments: SalePayment[];
  paidAmount: number;
  changeAmount: number;
  remainingCredit: number;
  status: 'COMPLETED' | 'HOLD' | 'VOIDED';
  voidReason?: string;
  timestamp: string;
}

export interface CustomerReturnItem {
  productId: string;
  quantity: number;
  originalUnitPrice: number;
  refundUnitPrice: number;
  totalRefund: number;
  condition: 'SALEABLE' | 'DAMAGED' | 'AWAITING_INSPECTION';
}

export interface CustomerReturn {
  id: string;
  returnNumber: string;
  tenantId: string;
  branchId: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  customerId?: string;
  items: CustomerReturnItem[];
  totalRefundAmount: number;
  refundPaymentMethod: PaymentMethod;
  reason: string;
  approvedBy: string;
  status: 'POSTED' | 'REJECTED';
  timestamp: string;
}

export interface GoodsReceiptItem {
  productId: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  totalCost: number;
  damagedQty?: number;
  notes?: string;
}

export interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  tenantId: string;
  branchId: string;
  supplierId: string;
  supplierInvoiceNumber: string;
  purchaseDate: string;
  items: GoodsReceiptItem[];
  totalCost: number;
  paidAmount: number;
  paymentMethod?: PaymentMethod;
  remainingPayable: number;
  receivedBy: string;
  status: 'POSTED' | 'DRAFT';
  timestamp: string;
}

export interface SupplierReturnItem {
  productId: string;
  quantity: number;
  unitCost: number;
  totalAmount: number;
  reason: string;
}

export interface SupplierReturn {
  id: string;
  returnNumber: string;
  tenantId: string;
  branchId: string;
  supplierId: string;
  receiptId?: string;
  items: SupplierReturnItem[];
  totalAmount: number;
  settlementType: 'PAYABLE_REDUCTION' | 'CASH_REFUND';
  approvedBy: string;
  timestamp: string;
}

export interface DeliveryZone {
  id: string;
  tenantId: string;
  nameAr: string;
  nameEn: string;
  areaDescription?: string;
  feeEgp: number;
  minOrderValue?: number;
  freeDeliveryThreshold?: number;
  estimatedMinutes?: number;
  active: boolean;
}

export type DeliveryStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_DISPATCH'
  | 'ASSIGNED'
  | 'DISPATCHED'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'PARTIALLY_DELIVERED'
  | 'FAILED'
  | 'RETURNED'
  | 'CANCELLED';

export type OrderPaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  tenantId: string;
  branchId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  zoneId: string;
  zoneNameAr: string;
  zoneNameEn: string;
  deliveryFee: number;
  items: CartItem[];
  productSubtotal: number;
  totalAmount: number; // productSubtotal + deliveryFee - discount
  paymentStatus: OrderPaymentStatus;
  paidAmount: number;
  remainingBalance: number;
  deliveryStatus: DeliveryStatus;
  assignedDriverId?: string;
  assignedDriverName?: string;
  createdBy: string;
  customerInstructions?: string;
  failureReason?: string;
  deliveredAt?: string;
  returnedItems?: { productId: string; returnedQty: number; reason: string; condition: 'SALEABLE' | 'DAMAGED' }[];
  timestamp: string;
}

export interface Driver {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  phone: string;
  active: boolean;
  compensationModel: 'PER_ORDER' | 'FIXED_SHIFT';
  rateEgp: number; // e.g. 15 EGP per order or 150 EGP per shift
}

export interface DriverExpense {
  id: string;
  driverId: string;
  branchId: string;
  amount: number;
  category: 'fuel' | 'parking' | 'toll' | 'maintenance' | 'other';
  description: string;
  fundingSource: 'DRIVER_COLLECTION' | 'SEPARATE_ADVANCE';
  approved: boolean;
  approvedBy?: string;
  timestamp: string;
}

export interface DriverAdvance {
  id: string;
  driverId: string;
  branchId: string;
  cashboxId: string;
  amount: number;
  issuedBy: string;
  reason: string;
  timestamp: string;
}

export interface DriverHandover {
  id: string;
  handoverNumber: string;
  driverId: string;
  driverName: string;
  branchId: string;
  cashboxId: string;
  amount: number;
  receivedBy: string;
  notes?: string;
  timestamp: string;
}

export interface DriverCustodySummary {
  driverId: string;
  driverName: string;
  openingCashCustody: number;
  customerCashCollections: number;
  deliveryFeeCollections: number;
  totalCashCollected: number;
  cashAdvancesReceived: number;
  approvedCashExpenses: number;
  previousCashHandovers: number;
  expectedRemainingCashCustody: number;
  activeOrdersCount: number;
  inTransitItemsCount: number;
  undeliveredOrdersCount: number;
  deliveredOrdersCount: number;
}

export interface DriverShiftCloseout {
  id: string;
  shiftNumber: string;
  driverId: string;
  driverName: string;
  branchId: string;
  date: string;
  openingCashCustody: number;
  totalCashCollected: number;
  cashAdvances: number;
  approvedExpenses: number;
  previousHandovers: number;
  expectedCashCustody: number;
  actualCashHandedOver: number;
  discrepancy: number; // actual - expected (negative = shortage, positive = surplus)
  discrepancyReason?: string;
  goodsReturnedAllAccounted: boolean;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'DISPUTED';
  closedBy: string;
  timestamp: string;
}

export interface Cashbox {
  id: string;
  tenantId: string;
  branchId: string;
  nameAr: string;
  nameEn: string;
  currentBalance: number;
  openingBalance: number;
  active: boolean;
}

export type CashboxTxType =
  | 'SALE_CASH'
  | 'DELIVERY_HANDOVER'
  | 'CUSTOMER_REFUND'
  | 'SUPPLIER_PAYMENT'
  | 'OPERATING_EXPENSE'
  | 'DRIVER_ADVANCE'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT';

export interface CashboxTransaction {
  id: string;
  tenantId: string;
  branchId: string;
  cashboxId: string;
  type: CashboxTxType;
  amount: number; // Positive = money in, Negative = money out
  balanceAfter: number;
  referenceId?: string;
  referenceType?: string;
  description: string;
  performedBy: string;
  timestamp: string;
}

export interface BusinessExpense {
  id: string;
  tenantId: string;
  branchId: string;
  cashboxId: string;
  category: string;
  amount: number;
  description: string;
  approved: boolean;
  approvedBy?: string;
  timestamp: string;
}

export interface ApprovalRequest {
  id: string;
  tenantId: string;
  branchId: string;
  type: 'DISCOUNT' | 'STOCK_ADJUSTMENT' | 'CUSTOMER_REFUND' | 'SUPPLIER_RETURN' | 'EXPENSE' | 'CUSTODY_DISCREPANCY';
  amount?: number;
  referenceId: string;
  requestedBy: string;
  requesterName: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  decisionNotes?: string;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  branchId: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface HardwareSettings {
  printerType: 'thermal_80mm' | 'thermal_58mm' | 'standard_a4';
  autoPrintReceipt: boolean;
  cashDrawerKick: boolean;
  scannerMode: 'keyboard_wedge' | 'camera';
  scaleMode: 'manual_fallback' | 'web_serial' | 'hid_scale';
}

export interface CashierShift {
  id: string;
  shiftNumber: string;
  cashierId: string;
  cashierName: string;
  branchId: string;
  cashboxId: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  cashSales: number;
  creditSales: number;
  cardSales: number;
  collections: number;
  refunds: number;
  cashDrops: number; // Drawer withdrawals
  cashDeposits: number;
  expectedCash: number;
  actualCash?: number;
  variance?: number; // actual - expected
  varianceNote?: string;
  status: 'OPEN' | 'CLOSED';
}

export interface TodayPrice {
  id: string;
  productId: string;
  sellingPrice: number;
  yesterdayPrice: number;
  lastPurchaseCost?: number;
  published: boolean;
  publishedAt?: string;
  publishedBy?: string;
}

export interface WasteRecord {
  id: string;
  tenantId: string;
  branchId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  reason: 'rotten' | 'crushed' | 'expired' | 'damaged' | 'other';
  reasonText: string;
  recordedBy: string;
  timestamp: string;
}

export interface StockAuditItem {
  productId: string;
  systemQty: number;
  countedQty: number;
  varianceQty: number;
  varianceCost: number;
  notes?: string;
}

export interface StockAuditSession {
  id: string;
  auditNumber: string;
  branchId: string;
  createdAt: string;
  status: 'DRAFT' | 'APPROVED' | 'APPLIED';
  items: StockAuditItem[];
  auditedBy: string;
  approvedBy?: string;
}

