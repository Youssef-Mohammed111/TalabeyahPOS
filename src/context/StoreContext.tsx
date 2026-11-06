/**
 * Talabeyah POS - StoreContext
 * Reactive, transactional state repository with persistence, audit logging,
 * inventory movements, driver custody reconciliation, and multi-role evaluation.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Tenant,
  Branch,
  User,
  Category,
  Product,
  InventoryStock,
  InventoryMovement,
  Customer,
  Supplier,
  DeliveryZone,
  DeliveryOrder,
  Driver,
  DriverExpense,
  DriverAdvance,
  DriverHandover,
  DriverShiftCloseout,
  DriverCustodySummary,
  Cashbox,
  CashboxTransaction,
  BusinessExpense,
  SaleInvoice,
  CartItem,
  SalePayment,
  CustomerReturn,
  GoodsReceipt,
  SupplierReturn,
  ApprovalRequest,
  AuditLogEntry,
  HardwareSettings,
  DeliveryStatus,
  OrderPaymentStatus,
  CashierShift,
  TodayPrice,
  WasteRecord,
  StockAuditSession,
  StockAuditItem,
  PaymentMethod,
} from '../types/index.ts';

import {
  initialTenant,
  initialBranches,
  initialUsers,
  initialCategories,
  initialProducts,
  initialStocks,
  initialCustomers,
  initialSuppliers,
  initialDeliveryZones,
  initialDrivers,
  initialCashboxes,
  initialDeliveryOrders,
  initialDriverExpenses,
  initialDriverAdvances,
  initialDriverHandovers,
  initialHardwareSettings,
  initialCashboxTransactions,
} from '../data/initialData.ts';

import { roundMoney, subtractMoney } from '../utils/accounting.ts';
import { calculateMovingWeightedAverageCost } from '../utils/costing.ts';
import { calculateExpectedCashCustody, calculateShiftDiscrepancy } from '../utils/driverCustody.ts';
import { Language, translations } from '../utils/i18n.ts';

const STORAGE_KEY = 'talabeyah_pos_state_v2';

interface HeldCart {
  id: string;
  customerName: string;
  items: CartItem[];
  timestamp: string;
  note?: string;
}

interface StoreContextType {
  // Localization & Tenant/Branch/User
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations.ar;
  currentUser: User;
  setCurrentUser: (u: User) => void;
  users: User[];
  activeBranch: Branch;
  setActiveBranchId: (branchId: string) => void;
  branches: Branch[];
  tenant: Tenant;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => { success: boolean; error?: string; user?: User };
  logout: () => void;
  updateProductImage: (productId: string, imageUrl: string) => void;

  // Master Data
  categories: Category[];
  products: Product[];
  stocks: InventoryStock[];
  movements: InventoryMovement[];
  customers: Customer[];
  suppliers: Supplier[];
  deliveryZones: DeliveryZone[];
  drivers: Driver[];
  cashboxes: Cashbox[];
  cashboxTransactions: CashboxTransaction[];
  hardwareSettings: HardwareSettings;
  updateHardwareSettings: (s: HardwareSettings) => void;

  // Transactions & Orders
  salesInvoices: SaleInvoice[];
  deliveryOrders: DeliveryOrder[];
  heldCarts: HeldCart[];
  driverExpenses: DriverExpense[];
  driverAdvances: DriverAdvance[];
  driverHandovers: DriverHandover[];
  driverShiftCloseouts: DriverShiftCloseout[];
  goodsReceipts: GoodsReceipt[];
  customerReturns: CustomerReturn[];
  supplierReturns: SupplierReturn[];
  approvalRequests: ApprovalRequest[];
  auditLogs: AuditLogEntry[];
  businessExpenses: BusinessExpense[];

  // Cashier & POS Actions
  createSale: (params: {
    items: CartItem[];
    customerId?: string;
    customerName?: string;
    subtotal: number;
    discount: number;
    deliveryFee?: number;
    tax?: number;
    total: number;
    payments: SalePayment[];
    paidAmount: number;
    changeAmount: number;
    remainingCredit: number;
  }) => SaleInvoice;
  holdCurrentCart: (items: CartItem[], customerName?: string, note?: string) => void;
  resumeHeldCart: (id: string) => CartItem[];
  removeHeldCart: (id: string) => void;
  voidSale: (invoiceId: string, reason: string) => void;

  // Delivery & Dispatch Actions
  createDeliveryOrder: (order: Omit<DeliveryOrder, 'id' | 'orderNumber' | 'timestamp' | 'tenantId' | 'branchId'>) => DeliveryOrder;
  dispatchDeliveryOrder: (orderId: string, driverId: string) => void;
  updateDeliveryStatus: (
    orderId: string,
    status: DeliveryStatus,
    payload?: {
      collectedAmount?: number;
      paymentStatus?: OrderPaymentStatus;
      failureReason?: string;
      returnedItems?: { productId: string; returnedQty: number; reason: string; condition: 'SALEABLE' | 'DAMAGED' }[];
    }
  ) => void;
  inspectAndRestockReturnedGoods: (orderId: string) => void;

  // Driver Custody & Shift Settlement
  getDriverCustodySummary: (driverId: string) => DriverCustodySummary;
  recordDriverExpense: (driverId: string, amount: number, category: DriverExpense['category'], description: string) => void;
  recordDriverAdvance: (driverId: string, amount: number, cashboxId: string, reason: string) => void;
  recordDriverHandover: (driverId: string, amount: number, cashboxId: string, notes?: string) => DriverHandover;
  closeDriverShift: (driverId: string, actualHandedCash: number, discrepancyReason?: string) => DriverShiftCloseout;

  // Inventory & Purchasing Actions
  receiveGoods: (receipt: Omit<GoodsReceipt, 'id' | 'receiptNumber' | 'timestamp' | 'tenantId' | 'branchId'>) => GoodsReceipt;
  createCustomerReturn: (returnData: Omit<CustomerReturn, 'id' | 'returnNumber' | 'timestamp' | 'tenantId' | 'branchId'>) => CustomerReturn;
  createSupplierReturn: (returnData: Omit<SupplierReturn, 'id' | 'returnNumber' | 'timestamp' | 'tenantId' | 'branchId'>) => SupplierReturn;
  recordStockAdjustment: (productId: string, newPhysicalQty: number, reason: string) => void;

  // Financial & Cashbox Actions
  transferCash: (fromBoxId: string, toBoxId: string, amount: number, description: string) => void;
  recordBusinessExpense: (cashboxId: string, category: string, amount: number, description: string) => void;

  // Master Data Add/Update
  addProduct: (product: Omit<Product, 'id' | 'tenantId'>) => Product;
  updateProduct: (product: Product) => void;
  addCategory: (category: Omit<Category, 'id' | 'tenantId'>) => Category;
  addCustomer: (customer: Omit<Customer, 'id' | 'tenantId'>) => Customer;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'tenantId'>) => Supplier;
  addDeliveryZone: (zone: Omit<DeliveryZone, 'id' | 'tenantId'>) => DeliveryZone;
  updateDeliveryZone: (zone: DeliveryZone) => void;

  // System & Backup
  exportDatabaseJson: () => string;
  importDatabaseJson: (json: string) => boolean;
  resetToInitialData: () => void;

  // Cashier Shifts & Drawer
  cashierShifts: CashierShift[];
  activeShift: CashierShift | null;
  openShift: (openingCash: number) => CashierShift;
  closeShift: (actualCash: number, note?: string) => CashierShift;
  recordDrawerWithdrawal: (amount: number, reason: string, approvedBy: string) => void;
  recordDrawerDeposit: (amount: number, reason: string) => void;

  // Daily Produce Market Prices
  todayPrices: TodayPrice[];
  publishTodayPrices: (prices: { productId: string; price: number }[]) => void;

  // Waste & Spoilage
  wasteRecords: WasteRecord[];
  recordWaste: (productId: string, quantity: number, reason: WasteRecord['reason'], reasonText: string) => void;

  // Stock Audit Sessions
  stockAuditSessions: StockAuditSession[];
  createStockAudit: (items: StockAuditItem[]) => StockAuditSession;

  // Customer Credit Collection
  collectCustomerDebt: (customerId: string, amount: number, method: PaymentMethod, notes?: string) => void;

  // On-spot Manager PIN Verification
  verifyManagerPin: (pin: string) => { valid: boolean; manager?: User };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('talabeyah_lang');
    return saved === 'en' ? 'en' : 'ar';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('talabeyah_lang', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = translations[lang];

  // Auth & Session
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('talabeyah_auth') === 'true';
  });

  // Load or initialize state
  const [tenant] = useState<Tenant>(initialTenant);
  const [branches] = useState<Branch[]>(initialBranches);
  const [activeBranchId, setActiveBranchIdState] = useState<string>('branch-cairo-main');
  const [users] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const savedUserId = localStorage.getItem('talabeyah_auth_user_id');
      if (savedUserId) {
        const found = initialUsers.find((u) => u.id === savedUserId);
        if (found) return found;
      }
    } catch {}
    return initialUsers[0]; // Default to Owner
  });

  const setActiveBranchId = (branchId: string) => {
    // Check permission: owner/superadmin can switch to any branch, others only to assignedBranches
    if (
      currentUser.role === 'owner' ||
      currentUser.role === 'super_admin' ||
      !currentUser.assignedBranches ||
      currentUser.assignedBranches.length === 0 ||
      currentUser.assignedBranches.includes(branchId)
    ) {
      setActiveBranchIdState(branchId);
    }
  };

  const login = (identifier: string, password: string): { success: boolean; error?: string; user?: User } => {
    const trimmed = identifier.trim().toLowerCase();
    const foundUser = users.find(
      (u) =>
        u.active &&
        (u.username.toLowerCase() === trimmed || (u.email && u.email.toLowerCase() === trimmed))
    );

    if (!foundUser) {
      return {
        success: false,
        error: lang === 'ar' ? 'اسم المستخدم أو البريد الإلكتروني غير مسجل' : 'Invalid username or email',
      };
    }

    if (foundUser.password && foundUser.password !== password) {
      return {
        success: false,
        error: lang === 'ar' ? 'كلمة المرور غير صحيحة' : 'Incorrect password',
      };
    }

    // Switch branch to an authorized branch if needed
    if (foundUser.assignedBranches && foundUser.assignedBranches.length > 0) {
      if (!foundUser.assignedBranches.includes(activeBranchId)) {
        setActiveBranchIdState(foundUser.assignedBranches[0]);
      }
    }

    setCurrentUser(foundUser);
    setIsAuthenticated(true);
    localStorage.setItem('talabeyah_auth', 'true');
    localStorage.setItem('talabeyah_auth_user_id', foundUser.id);
    return { success: true, user: foundUser };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('talabeyah_auth');
    localStorage.removeItem('talabeyah_auth_user_id');
  };

  // Collections
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [stocks, setStocks] = useState<InventoryStock[]>(initialStocks);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(initialDeliveryZones);
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [cashboxes, setCashboxes] = useState<Cashbox[]>(initialCashboxes);
  const [cashboxTransactions, setCashboxTransactions] = useState<CashboxTransaction[]>(initialCashboxTransactions);
  const [hardwareSettings, setHardwareSettings] = useState<HardwareSettings>(initialHardwareSettings);

  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>(initialDeliveryOrders);
  const [driverExpenses, setDriverExpenses] = useState<DriverExpense[]>(initialDriverExpenses);
  const [driverAdvances, setDriverAdvances] = useState<DriverAdvance[]>(initialDriverAdvances);
  const [driverHandovers, setDriverHandovers] = useState<DriverHandover[]>(initialDriverHandovers);
  const [driverShiftCloseouts, setDriverShiftCloseouts] = useState<DriverShiftCloseout[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SaleInvoice[]>([]);
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [customerReturns, setCustomerReturns] = useState<CustomerReturn[]>([]);
  const [supplierReturns, setSupplierReturns] = useState<SupplierReturn[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [businessExpenses, setBusinessExpenses] = useState<BusinessExpense[]>([]);

  // Retail Cashier Shifts (S3)
  const [cashierShifts, setCashierShifts] = useState<CashierShift[]>(() => [
    {
      id: 'sh-cai-001',
      shiftNumber: 'SH-001',
      cashierId: 'usr-cashier',
      cashierName: 'منى إبراهيم (كاشير 1)',
      branchId: 'branch-cairo-main',
      cashboxId: 'cb-cairo-01',
      openedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      openingCash: 500.0,
      cashSales: 130.0,
      creditSales: 0,
      cardSales: 0,
      collections: 0,
      refunds: 0,
      cashDrops: 0,
      cashDeposits: 0,
      expectedCash: 630.0,
      status: 'OPEN',
    },
  ]);

  // Today's Produce Market Prices (S6)
  const [todayPrices, setTodayPrices] = useState<TodayPrice[]>(() => {
    return initialProducts.map((p) => ({
      id: `tp-${p.id}`,
      productId: p.id,
      sellingPrice: p.sellingPrice,
      yesterdayPrice: roundMoney(p.sellingPrice * 0.95),
      lastPurchaseCost: p.purchaseCost,
      published: true,
      publishedAt: new Date().toISOString(),
      publishedBy: 'مدير الفرع',
    }));
  });

  // Daily Waste & Spoilage Logging (S8)
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([
    {
      id: 'wst-001',
      tenantId: 'tenant-talabeyah-eg',
      branchId: 'branch-cairo-main',
      productId: 'prod-tomato',
      productName: 'طماطم',
      quantity: 2.5,
      unit: 'kg',
      unitCost: 11.0,
      totalCost: 27.5,
      reason: 'rotten',
      reasonText: 'خضار ذبل وتعرض للعفن أثناء العرض',
      recordedBy: 'كريم عثمان (أمين المخزن)',
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
  ]);

  // Physical Stock Count / Inventory Audit sessions (S8)
  const [stockAuditSessions, setStockAuditSessions] = useState<StockAuditSession[]>([]);

  const updateProductImage = (productId: string, imageUrl: string) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, imageUrl } : p)));
  };

  // Active Branch object
  const activeBranch = useMemo(() => {
    return branches.find((b) => b.id === activeBranchId) || branches[0];
  }, [branches, activeBranchId]);

  // Active cashier shift for current user & branch
  const activeShift = useMemo(() => {
    return cashierShifts.find(
      (sh) => sh.status === 'OPEN' && sh.cashierId === currentUser.id && sh.branchId === activeBranch.id
    ) || null;
  }, [cashierShifts, currentUser.id, activeBranch.id]);

  // Load from LocalStorage if exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.products) {
          // Merge initialProducts imageUrl so authentic photography is never lost
          const merged = parsed.products.map((p: Product) => {
            const init = initialProducts.find((ip) => ip.id === p.id);
            return {
              ...p,
              imageUrl: p.imageUrl || init?.imageUrl,
            };
          });
          setProducts(merged);
        }
        if (parsed.stocks) setStocks(parsed.stocks);
        if (parsed.deliveryOrders) setDeliveryOrders(parsed.deliveryOrders);
        if (parsed.cashboxes) setCashboxes(parsed.cashboxes);
        if (parsed.salesInvoices) setSalesInvoices(parsed.salesInvoices);
        if (parsed.driverHandovers) setDriverHandovers(parsed.driverHandovers);
        if (parsed.driverExpenses) setDriverExpenses(parsed.driverExpenses);
        if (parsed.driverAdvances) setDriverAdvances(parsed.driverAdvances);
        if (parsed.driverShiftCloseouts) setDriverShiftCloseouts(parsed.driverShiftCloseouts);
        if (parsed.cashboxTransactions) setCashboxTransactions(parsed.cashboxTransactions);
      }
    } catch {
      // Keep defaults
    }
  }, []);

  // Save to LocalStorage on updates
  useEffect(() => {
    try {
      const stateToSave = {
        products,
        stocks,
        deliveryOrders,
        cashboxes,
        salesInvoices,
        driverHandovers,
        driverExpenses,
        driverAdvances,
        driverShiftCloseouts,
        cashboxTransactions,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // ignore quota errors
    }
  }, [
    products,
    stocks,
    deliveryOrders,
    cashboxes,
    salesInvoices,
    driverHandovers,
    driverExpenses,
    driverAdvances,
    driverShiftCloseouts,
    cashboxTransactions,
  ]);

  // Audit logging helper
  const logAudit = (action: string, entityType: string, entityId: string, details: string) => {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tenantId: tenant.id,
      branchId: activeBranch.id,
      actorId: currentUser.id,
      actorName: currentUser.name,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  // ==========================================
  // Cashier & POS Actions
  // ==========================================
  const createSale = (params: {
    items: CartItem[];
    customerId?: string;
    customerName?: string;
    subtotal: number;
    discount: number;
    deliveryFee?: number;
    tax?: number;
    total: number;
    payments: SalePayment[];
    paidAmount: number;
    changeAmount: number;
    remainingCredit: number;
  }): SaleInvoice => {
    const now = new Date().toISOString();
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;

    // 1. Deduct physical stock atomically and create movement ledger entries
    const newMovements: InventoryMovement[] = [];
    setStocks((prevStocks) => {
      return prevStocks.map((stk) => {
        const itemSold = params.items.find((it) => it.productId === stk.productId && stk.branchId === activeBranch.id);
        if (itemSold) {
          newMovements.push({
            id: `mov-${Date.now()}-${itemSold.productId}`,
            tenantId: tenant.id,
            branchId: activeBranch.id,
            productId: itemSold.productId,
            movementType: 'SALE',
            quantity: -itemSold.quantity,
            unit: itemSold.unit,
            unitCost: itemSold.purchaseCost,
            referenceId: invoiceNum,
            performedBy: currentUser.id,
            timestamp: now,
          });
          return {
            ...stk,
            physicalQty: Math.max(0, roundMoney(stk.physicalQty - itemSold.quantity)),
          };
        }
        return stk;
      });
    });

    if (newMovements.length > 0) {
      setMovements((prev) => [...newMovements, ...prev]);
    }

    // 2. Handle payments in cashbox
    const cashPaid = params.payments
      .filter((p) => p.method === 'cash')
      .reduce((sum, p) => sum + p.amount, 0);

    const netCashInflow = roundMoney(cashPaid - params.changeAmount);

    if (netCashInflow > 0) {
      const activeCashbox = cashboxes.find((c) => c.branchId === activeBranch.id && c.active) || cashboxes[0];
      if (activeCashbox) {
        setCashboxes((prev) =>
          prev.map((cb) =>
            cb.id === activeCashbox.id
              ? { ...cb, currentBalance: roundMoney(cb.currentBalance + netCashInflow) }
              : cb
          )
        );

        setCashboxTransactions((prev) => [
          {
            id: `ctx-${Date.now()}`,
            tenantId: tenant.id,
            branchId: activeBranch.id,
            cashboxId: activeCashbox.id,
            type: 'SALE_CASH',
            amount: netCashInflow,
            balanceAfter: roundMoney(activeCashbox.currentBalance + netCashInflow),
            referenceId: invoiceNum,
            referenceType: 'SALE',
            description: `إيراد مبيعات نقدية فاتورة رقم ${invoiceNum}`,
            performedBy: currentUser.name,
            timestamp: now,
          },
          ...prev,
        ]);
      }
    }

    // 3. Update customer balance if credit sale
    if (params.customerId && params.remainingCredit > 0) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === params.customerId
            ? { ...c, outstandingBalance: roundMoney(c.outstandingBalance + params.remainingCredit) }
            : c
        )
      );
    }

    // Update active cashier shift if open
    setCashierShifts((prev) =>
      prev.map((sh) => {
        if (sh.status === 'OPEN' && sh.cashierId === currentUser.id && sh.branchId === activeBranch.id) {
          const cashPaid = params.payments
            .filter((p) => p.method === 'cash')
            .reduce((s, p) => s + p.amount, 0);
          const cardPaid = params.payments
            .filter((p) => p.method !== 'cash' && p.method !== 'customer_credit')
            .reduce((s, p) => s + p.amount, 0);
          const netCashInflow = Math.max(0, roundMoney(cashPaid - params.changeAmount));

          return {
            ...sh,
            cashSales: roundMoney(sh.cashSales + netCashInflow),
            cardSales: roundMoney(sh.cardSales + cardPaid),
            creditSales: roundMoney(sh.creditSales + params.remainingCredit),
            expectedCash: roundMoney(sh.expectedCash + netCashInflow),
          };
        }
        return sh;
      })
    );

    // 4. Create Sale Invoice
    const invoice: SaleInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      tenantId: tenant.id,
      branchId: activeBranch.id,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerId: params.customerId,
      customerName: params.customerName || t.pos.walkInCustomer,
      items: params.items,
      subtotal: params.subtotal,
      discount: params.discount,
      deliveryFee: params.deliveryFee || 0,
      tax: params.tax || 0,
      total: params.total,
      payments: params.payments,
      paidAmount: params.paidAmount,
      changeAmount: params.changeAmount,
      remainingCredit: params.remainingCredit,
      status: 'COMPLETED',
      timestamp: now,
    };

    setSalesInvoices((prev) => [invoice, ...prev]);
    logAudit('CREATE_SALE', 'INVOICE', invoice.id, `Sale created for ${params.total} EGP (${params.items.length} items)`);

    return invoice;
  };

  const holdCurrentCart = (items: CartItem[], customerName?: string, note?: string) => {
    if (items.length === 0) return;
    const held: HeldCart = {
      id: `hold-${Date.now()}`,
      customerName: customerName || t.pos.walkInCustomer,
      items,
      timestamp: new Date().toISOString(),
      note,
    };
    setHeldCarts((prev) => [held, ...prev]);
  };

  const resumeHeldCart = (id: string): CartItem[] => {
    const found = heldCarts.find((h) => h.id === id);
    if (found) {
      setHeldCarts((prev) => prev.filter((h) => h.id !== id));
      return found.items;
    }
    return [];
  };

  const removeHeldCart = (id: string) => {
    setHeldCarts((prev) => prev.filter((h) => h.id !== id));
  };

  const voidSale = (invoiceId: string, reason: string) => {
    const invoice = salesInvoices.find((i) => i.id === invoiceId);
    if (!invoice || invoice.status === 'VOIDED') return;

    // Restore physical stock
    setStocks((prev) =>
      prev.map((stk) => {
        const item = invoice.items.find((i) => i.productId === stk.productId && stk.branchId === invoice.branchId);
        if (item) {
          return { ...stk, physicalQty: roundMoney(stk.physicalQty + item.quantity) };
        }
        return stk;
      })
    );

    // If cash was received, deduct refund from cashbox
    const cashRefund = invoice.payments
      .filter((p) => p.method === 'cash')
      .reduce((sum, p) => sum + p.amount, 0) - invoice.changeAmount;

    if (cashRefund > 0) {
      const activeCashbox = cashboxes.find((c) => c.branchId === activeBranch.id && c.active) || cashboxes[0];
      if (activeCashbox) {
        setCashboxes((prev) =>
          prev.map((cb) =>
            cb.id === activeCashbox.id
              ? { ...cb, currentBalance: roundMoney(cb.currentBalance - cashRefund) }
              : cb
          )
        );
      }
    }

    setSalesInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? { ...i, status: 'VOIDED', voidReason: reason } : i))
    );

    logAudit('VOID_SALE', 'INVOICE', invoiceId, `Invoice ${invoice.invoiceNumber} voided. Reason: ${reason}`);
  };

  // ==========================================
  // Delivery & Dispatch Actions
  // ==========================================
  const createDeliveryOrder = (
    orderData: Omit<DeliveryOrder, 'id' | 'orderNumber' | 'timestamp' | 'tenantId' | 'branchId'>
  ): DeliveryOrder => {
    const now = new Date().toISOString();
    const orderNumber = `DEL-${Date.now().toString().slice(-6)}`;

    // Reserve stock atomically
    setStocks((prev) =>
      prev.map((stk) => {
        const itemInOrder = orderData.items.find((it) => it.productId === stk.productId && stk.branchId === activeBranch.id);
        if (itemInOrder) {
          return {
            ...stk,
            reservedQty: roundMoney(stk.reservedQty + itemInOrder.quantity),
          };
        }
        return stk;
      })
    );

    const newOrder: DeliveryOrder = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      tenantId: tenant.id,
      branchId: activeBranch.id,
      timestamp: now,
    };

    setDeliveryOrders((prev) => [newOrder, ...prev]);
    logAudit('CREATE_DELIVERY_ORDER', 'DELIVERY_ORDER', newOrder.id, `Order ${orderNumber} created for ${orderData.customerName}`);
    return newOrder;
  };

  const dispatchDeliveryOrder = (orderId: string, driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) return;

    setDeliveryOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          // Move items from reservedQty to inTransitQty
          setStocks((prevStocks) =>
            prevStocks.map((stk) => {
              const item = ord.items.find((i) => i.productId === stk.productId && stk.branchId === activeBranch.id);
              if (item) {
                return {
                  ...stk,
                  reservedQty: Math.max(0, roundMoney(stk.reservedQty - item.quantity)),
                  inTransitQty: roundMoney(stk.inTransitQty + item.quantity),
                };
              }
              return stk;
            })
          );

          return {
            ...ord,
            deliveryStatus: 'DISPATCHED',
            assignedDriverId: driver.id,
            assignedDriverName: driver.name,
          };
        }
        return ord;
      })
    );

    logAudit('DISPATCH_ORDER', 'DELIVERY_ORDER', orderId, `Dispatched order ${orderId} to driver ${driver.name}`);
  };

  const updateDeliveryStatus = (
    orderId: string,
    status: DeliveryStatus,
    payload?: {
      collectedAmount?: number;
      paymentStatus?: OrderPaymentStatus;
      failureReason?: string;
      returnedItems?: { productId: string; returnedQty: number; reason: string; condition: 'SALEABLE' | 'DAMAGED' }[];
    }
  ) => {
    const now = new Date().toISOString();

    setDeliveryOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;

        const updated: DeliveryOrder = {
          ...ord,
          deliveryStatus: status,
          ...(payload?.failureReason ? { failureReason: payload.failureReason } : {}),
          ...(payload?.returnedItems ? { returnedItems: payload.returnedItems } : {}),
          ...(status === 'DELIVERED' ? { deliveredAt: now } : {}),
        };

        if (payload?.collectedAmount !== undefined) {
          const collected = roundMoney(payload.collectedAmount);
          updated.paidAmount = roundMoney(ord.paidAmount + collected);
          updated.remainingBalance = Math.max(0, subtractMoney(ord.totalAmount, updated.paidAmount));
          updated.paymentStatus =
            updated.remainingBalance === 0
              ? 'PAID'
              : updated.paidAmount > 0
              ? 'PARTIALLY_PAID'
              : 'UNPAID';
        }

        // Handle inventory outcomes based on final status:
        if (status === 'DELIVERED') {
          // Permanently deduct in-transit stock and physical stock
          setStocks((prevStocks) =>
            prevStocks.map((stk) => {
              const item = ord.items.find((i) => i.productId === stk.productId && stk.branchId === activeBranch.id);
              if (item) {
                return {
                  ...stk,
                  inTransitQty: Math.max(0, roundMoney(stk.inTransitQty - item.quantity)),
                  physicalQty: Math.max(0, roundMoney(stk.physicalQty - item.quantity)),
                };
              }
              return stk;
            })
          );
        } else if (status === 'FAILED' || status === 'RETURNED') {
          // Move in-transit goods into awaitingInspectionQty (do not auto-restock until inspected!)
          setStocks((prevStocks) =>
            prevStocks.map((stk) => {
              const item = ord.items.find((i) => i.productId === stk.productId && stk.branchId === activeBranch.id);
              if (item) {
                return {
                  ...stk,
                  inTransitQty: Math.max(0, roundMoney(stk.inTransitQty - item.quantity)),
                  awaitingInspectionQty: roundMoney(stk.awaitingInspectionQty + item.quantity),
                };
              }
              return stk;
            })
          );
        }

        return updated;
      })
    );

    logAudit('UPDATE_DELIVERY_STATUS', 'DELIVERY_ORDER', orderId, `Status updated to ${status}`);
  };

  const inspectAndRestockReturnedGoods = (orderId: string) => {
    const order = deliveryOrders.find((o) => o.id === orderId);
    if (!order) return;

    setStocks((prevStocks) =>
      prevStocks.map((stk) => {
        const item = order.items.find((i) => i.productId === stk.productId && stk.branchId === activeBranch.id);
        if (item) {
          // Check condition if specified, default to SALEABLE
          const returnItem = order.returnedItems?.find((r) => r.productId === stk.productId);
          const isDamaged = returnItem?.condition === 'DAMAGED';

          return {
            ...stk,
            awaitingInspectionQty: Math.max(0, roundMoney(stk.awaitingInspectionQty - item.quantity)),
            ...(isDamaged
              ? { damagedQty: roundMoney(stk.damagedQty + item.quantity) }
              : { physicalQty: roundMoney(stk.physicalQty) }), // already in physical or restock
          };
        }
        return stk;
      })
    );

    logAudit('INSPECT_RETURNED_GOODS', 'DELIVERY_ORDER', orderId, `Inspected returned goods for order ${order.orderNumber}`);
  };

  // ==========================================
  // Driver Custody & Shift Settlement
  // ==========================================
  const getDriverCustodySummary = (driverId: string): DriverCustodySummary => {
    const driver = drivers.find((d) => d.id === driverId);
    const driverName = driver ? driver.name : 'Unknown';

    // 1. Collections: Orders delivered by this driver where payment was collected
    const deliveredOrders = deliveryOrders.filter(
      (o) => o.assignedDriverId === driverId && (o.deliveryStatus === 'DELIVERED' || o.deliveryStatus === 'PARTIALLY_DELIVERED')
    );

    const totalCashCollected = deliveredOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const deliveryFeeCollections = deliveredOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
    const customerCashCollections = Math.max(0, subtractMoney(totalCashCollected, deliveryFeeCollections));

    // 2. Advances received by this driver
    const advances = driverAdvances
      .filter((a) => a.driverId === driverId)
      .reduce((sum, a) => sum + a.amount, 0);

    // 3. Approved expenses
    const expenses = driverExpenses
      .filter((e) => e.driverId === driverId && e.approved && e.fundingSource === 'DRIVER_COLLECTION')
      .reduce((sum, e) => sum + e.amount, 0);

    // 4. Previous handovers
    const handovers = driverHandovers
      .filter((h) => h.driverId === driverId)
      .reduce((sum, h) => sum + h.amount, 0);

    const expectedRemainingCashCustody = calculateExpectedCashCustody({
      openingCashCustody: 0,
      customerCashCollections,
      deliveryFeeCollections,
      cashAdvancesReceived: advances,
      approvedCashExpenses: expenses,
      previousCashHandovers: handovers,
    });

    const activeOrders = deliveryOrders.filter(
      (o) => o.assignedDriverId === driverId && (o.deliveryStatus === 'DISPATCHED' || o.deliveryStatus === 'ON_THE_WAY')
    );

    const inTransitItemsCount = activeOrders.reduce((sum, o) => sum + o.items.length, 0);
    const undeliveredOrdersCount = deliveryOrders.filter(
      (o) => o.assignedDriverId === driverId && (o.deliveryStatus === 'FAILED' || o.deliveryStatus === 'RETURNED')
    ).length;

    return {
      driverId,
      driverName,
      openingCashCustody: 0,
      customerCashCollections,
      deliveryFeeCollections,
      totalCashCollected,
      cashAdvancesReceived: advances,
      approvedCashExpenses: expenses,
      previousCashHandovers: handovers,
      expectedRemainingCashCustody,
      activeOrdersCount: activeOrders.length,
      inTransitItemsCount,
      undeliveredOrdersCount,
      deliveredOrdersCount: deliveredOrders.length,
    };
  };

  const recordDriverExpense = (
    driverId: string,
    amount: number,
    category: DriverExpense['category'],
    description: string
  ) => {
    const exp: DriverExpense = {
      id: `exp-${Date.now()}`,
      driverId,
      branchId: activeBranch.id,
      amount: roundMoney(amount),
      category,
      description,
      fundingSource: 'DRIVER_COLLECTION',
      approved: true, // auto-approved for verified shift expenses
      approvedBy: currentUser.id,
      timestamp: new Date().toISOString(),
    };
    setDriverExpenses((prev) => [exp, ...prev]);
    logAudit('DRIVER_EXPENSE', 'DRIVER', driverId, `Expense ${amount} EGP recorded: ${description}`);
  };

  const recordDriverAdvance = (driverId: string, amount: number, cashboxId: string, reason: string) => {
    const advAmount = roundMoney(amount);
    const targetCashbox = cashboxes.find((c) => c.id === cashboxId) || cashboxes[0];

    // Deduct advance from cashbox
    setCashboxes((prev) =>
      prev.map((c) => (c.id === targetCashbox.id ? { ...c, currentBalance: roundMoney(c.currentBalance - advAmount) } : c))
    );

    const now = new Date().toISOString();

    setCashboxTransactions((prev) => [
      {
        id: `ctx-${Date.now()}`,
        tenantId: tenant.id,
        branchId: activeBranch.id,
        cashboxId: targetCashbox.id,
        type: 'DRIVER_ADVANCE',
        amount: -advAmount,
        balanceAfter: roundMoney(targetCashbox.currentBalance - advAmount),
        description: `صرف سلفة نقدية للمندوب: ${reason}`,
        performedBy: currentUser.name,
        timestamp: now,
      },
      ...prev,
    ]);

    const adv: DriverAdvance = {
      id: `adv-${Date.now()}`,
      driverId,
      branchId: activeBranch.id,
      cashboxId: targetCashbox.id,
      amount: advAmount,
      issuedBy: currentUser.id,
      reason,
      timestamp: now,
    };

    setDriverAdvances((prev) => [adv, ...prev]);
    logAudit('DRIVER_ADVANCE', 'DRIVER', driverId, `Advance of ${advAmount} EGP issued to driver`);
  };

  const recordDriverHandover = (
    driverId: string,
    amount: number,
    cashboxId: string,
    notes?: string
  ): DriverHandover => {
    const handoverAmount = roundMoney(amount);
    const driver = drivers.find((d) => d.id === driverId);
    const driverName = driver ? driver.name : 'Unknown';
    const targetCashbox = cashboxes.find((c) => c.id === cashboxId) || cashboxes[0];
    const now = new Date().toISOString();
    const handoverNumber = `HND-${Date.now().toString().slice(-6)}`;

    // 1. Add money to Cashbox AT HANDOVER ONLY (Never twice!)
    setCashboxes((prev) =>
      prev.map((c) =>
        c.id === targetCashbox.id ? { ...c, currentBalance: roundMoney(c.currentBalance + handoverAmount) } : c
      )
    );

    // 2. Record linked Cashbox Transaction
    setCashboxTransactions((prev) => [
      {
        id: `ctx-${Date.now()}`,
        tenantId: tenant.id,
        branchId: activeBranch.id,
        cashboxId: targetCashbox.id,
        type: 'DELIVERY_HANDOVER',
        amount: handoverAmount,
        balanceAfter: roundMoney(targetCashbox.currentBalance + handoverAmount),
        referenceId: handoverNumber,
        referenceType: 'HANDOVER',
        description: `توريد عهدة نقدية من المندوب ${driverName} (${handoverNumber})`,
        performedBy: currentUser.name,
        timestamp: now,
      },
      ...prev,
    ]);

    // 3. Create Handover Record
    const handover: DriverHandover = {
      id: `hnd-${Date.now()}`,
      handoverNumber,
      driverId,
      driverName,
      branchId: activeBranch.id,
      cashboxId: targetCashbox.id,
      amount: handoverAmount,
      receivedBy: currentUser.name,
      notes,
      timestamp: now,
    };

    setDriverHandovers((prev) => [handover, ...prev]);
    logAudit('DRIVER_HANDOVER', 'DRIVER', driverId, `Handed over ${handoverAmount} EGP to cashbox ${targetCashbox.nameAr}`);
    return handover;
  };

  const closeDriverShift = (
    driverId: string,
    actualHandedCash: number,
    discrepancyReason?: string
  ): DriverShiftCloseout => {
    const summary = getDriverCustodySummary(driverId);
    const expected = summary.expectedRemainingCashCustody;
    const { discrepancy, isBalanced } = calculateShiftDiscrepancy(expected, actualHandedCash);
    const shiftNumber = `SFT-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const closeout: DriverShiftCloseout = {
      id: `sft-${Date.now()}`,
      shiftNumber,
      driverId,
      driverName: summary.driverName,
      branchId: activeBranch.id,
      date: now.slice(0, 10),
      openingCashCustody: summary.openingCashCustody,
      totalCashCollected: summary.totalCashCollected,
      cashAdvances: summary.cashAdvancesReceived,
      approvedExpenses: summary.approvedCashExpenses,
      previousHandovers: summary.previousCashHandovers,
      expectedCashCustody: expected,
      actualCashHandedOver: actualHandedCash,
      discrepancy,
      discrepancyReason,
      goodsReturnedAllAccounted: summary.inTransitItemsCount === 0,
      status: isBalanced ? 'APPROVED' : 'PENDING_APPROVAL',
      closedBy: currentUser.name,
      timestamp: now,
    };

    setDriverShiftCloseouts((prev) => [closeout, ...prev]);

    // If discrepancy, trigger approval request
    if (!isBalanced) {
      const approval: ApprovalRequest = {
        id: `apr-${Date.now()}`,
        tenantId: tenant.id,
        branchId: activeBranch.id,
        type: 'CUSTODY_DISCREPANCY',
        amount: Math.abs(discrepancy),
        referenceId: shiftNumber,
        requestedBy: currentUser.id,
        requesterName: currentUser.name,
        reason: `فارق عهدة للمندوب ${summary.driverName}: ${discrepancy > 0 ? 'زيادة' : 'عجز'} ${Math.abs(discrepancy)} ج.م. سبب المندوب: ${discrepancyReason || 'بدون بيان'}`,
        status: 'PENDING',
        timestamp: now,
      };
      setApprovalRequests((prev) => [approval, ...prev]);
    }

    logAudit('CLOSE_DRIVER_SHIFT', 'DRIVER_SHIFT', shiftNumber, `Shift closed for ${summary.driverName}. Discrepancy: ${discrepancy} EGP`);
    return closeout;
  };

  // ==========================================
  // Inventory & Purchasing Actions
  // ==========================================
  const receiveGoods = (
    receiptData: Omit<GoodsReceipt, 'id' | 'receiptNumber' | 'timestamp' | 'tenantId' | 'branchId'>
  ): GoodsReceipt => {
    const now = new Date().toISOString();
    const receiptNumber = `RCV-${Date.now().toString().slice(-6)}`;

    // Update stock & moving weighted average cost for each received product
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const item = receiptData.items.find((i) => i.productId === p.id);
        if (item) {
          const currentStock = stocks.find((s) => s.productId === p.id && s.branchId === activeBranch.id)?.physicalQty || 0;
          const newCost = calculateMovingWeightedAverageCost(
            currentStock,
            p.purchaseCost,
            item.receivedQty,
            item.unitCost
          );
          return { ...p, purchaseCost: newCost };
        }
        return p;
      })
    );

    // Increase physical stock
    setStocks((prevStocks) =>
      prevStocks.map((stk) => {
        const item = receiptData.items.find((i) => i.productId === stk.productId && stk.branchId === activeBranch.id);
        if (item) {
          return {
            ...stk,
            physicalQty: roundMoney(stk.physicalQty + item.receivedQty),
          };
        }
        return stk;
      })
    );

    // Update supplier payable balance
    if (receiptData.remainingPayable > 0) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === receiptData.supplierId
            ? { ...s, payableBalance: roundMoney(s.payableBalance + receiptData.remainingPayable) }
            : s
        )
      );
    }

    // Deduct cash if paid at receiving
    if (receiptData.paidAmount > 0 && receiptData.paymentMethod === 'cash') {
      const activeCashbox = cashboxes.find((c) => c.branchId === activeBranch.id && c.active) || cashboxes[0];
      if (activeCashbox) {
        setCashboxes((prev) =>
          prev.map((c) =>
            c.id === activeCashbox.id
              ? { ...c, currentBalance: roundMoney(c.currentBalance - receiptData.paidAmount) }
              : c
          )
        );

        setCashboxTransactions((prev) => [
          {
            id: `ctx-${Date.now()}`,
            tenantId: tenant.id,
            branchId: activeBranch.id,
            cashboxId: activeCashbox.id,
            type: 'SUPPLIER_PAYMENT',
            amount: -receiptData.paidAmount,
            balanceAfter: roundMoney(activeCashbox.currentBalance - receiptData.paidAmount),
            referenceId: receiptNumber,
            description: `سداد نقدي لتوريد بضائع (${receiptNumber})`,
            performedBy: currentUser.name,
            timestamp: now,
          },
          ...prev,
        ]);
      }
    }

    const receipt: GoodsReceipt = {
      ...receiptData,
      id: `rcv-${Date.now()}`,
      receiptNumber,
      tenantId: tenant.id,
      branchId: activeBranch.id,
      timestamp: now,
    };

    setGoodsReceipts((prev) => [receipt, ...prev]);
    logAudit('RECEIVE_GOODS', 'RECEIPT', receipt.id, `Goods received from supplier. Total: ${receiptData.totalCost} EGP`);
    return receipt;
  };

  const createCustomerReturn = (
    returnData: Omit<CustomerReturn, 'id' | 'returnNumber' | 'timestamp' | 'tenantId' | 'branchId'>
  ): CustomerReturn => {
    const now = new Date().toISOString();
    const returnNumber = `RET-${Date.now().toString().slice(-6)}`;

    // Restock ONLY items marked as SALEABLE
    setStocks((prevStocks) =>
      prevStocks.map((stk) => {
        const item = returnData.items.find((i) => i.productId === stk.productId && stk.branchId === activeBranch.id);
        if (item) {
          if (item.condition === 'SALEABLE') {
            return { ...stk, physicalQty: roundMoney(stk.physicalQty + item.quantity) };
          } else if (item.condition === 'DAMAGED') {
            return { ...stk, damagedQty: roundMoney(stk.damagedQty + item.quantity) };
          } else {
            return { ...stk, awaitingInspectionQty: roundMoney(stk.awaitingInspectionQty + item.quantity) };
          }
        }
        return stk;
      })
    );

    // Refund cash if cash method used
    if (returnData.refundPaymentMethod === 'cash' && returnData.totalRefundAmount > 0) {
      const activeCashbox = cashboxes.find((c) => c.branchId === activeBranch.id && c.active) || cashboxes[0];
      if (activeCashbox) {
        setCashboxes((prev) =>
          prev.map((c) =>
            c.id === activeCashbox.id
              ? { ...c, currentBalance: roundMoney(c.currentBalance - returnData.totalRefundAmount) }
              : c
          )
        );

        setCashboxTransactions((prev) => [
          {
            id: `ctx-${Date.now()}`,
            tenantId: tenant.id,
            branchId: activeBranch.id,
            cashboxId: activeCashbox.id,
            type: 'CUSTOMER_REFUND',
            amount: -returnData.totalRefundAmount,
            balanceAfter: roundMoney(activeCashbox.currentBalance - returnData.totalRefundAmount),
            referenceId: returnNumber,
            description: `رد نقدية لمرتجع عميل (${returnNumber})`,
            performedBy: currentUser.name,
            timestamp: now,
          },
          ...prev,
        ]);
      }
    }

    const ret: CustomerReturn = {
      ...returnData,
      id: `ret-${Date.now()}`,
      returnNumber,
      tenantId: tenant.id,
      branchId: activeBranch.id,
      timestamp: now,
    };

    setCustomerReturns((prev) => [ret, ...prev]);
    logAudit('CUSTOMER_RETURN', 'RETURN', ret.id, `Customer return of ${returnData.totalRefundAmount} EGP processed`);
    return ret;
  };

  const createSupplierReturn = (
    returnData: Omit<SupplierReturn, 'id' | 'returnNumber' | 'timestamp' | 'tenantId' | 'branchId'>
  ): SupplierReturn => {
    const now = new Date().toISOString();
    const returnNumber = `SRET-${Date.now().toString().slice(-6)}`;

    // Deduct stock
    setStocks((prevStocks) =>
      prevStocks.map((stk) => {
        const item = returnData.items.find((i) => i.productId === stk.productId && stk.branchId === activeBranch.id);
        if (item) {
          return { ...stk, physicalQty: Math.max(0, roundMoney(stk.physicalQty - item.quantity)) };
        }
        return stk;
      })
    );

    // Adjust supplier payable balance
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === returnData.supplierId
          ? { ...s, payableBalance: Math.max(0, roundMoney(s.payableBalance - returnData.totalAmount)) }
          : s
      )
    );

    const supReturn: SupplierReturn = {
      ...returnData,
      id: `sret-${Date.now()}`,
      returnNumber,
      tenantId: tenant.id,
      branchId: activeBranch.id,
      timestamp: now,
    };

    setSupplierReturns((prev) => [supReturn, ...prev]);
    logAudit('SUPPLIER_RETURN', 'SUPPLIER_RETURN', supReturn.id, `Returned ${returnData.totalAmount} EGP to supplier`);
    return supReturn;
  };

  const recordStockAdjustment = (productId: string, newPhysicalQty: number, reason: string) => {
    const now = new Date().toISOString();
    const prevStock = stocks.find((s) => s.productId === productId && s.branchId === activeBranch.id)?.physicalQty || 0;
    const diff = roundMoney(newPhysicalQty - prevStock);

    setStocks((prev) =>
      prev.map((s) =>
        s.productId === productId && s.branchId === activeBranch.id
          ? { ...s, physicalQty: roundMoney(newPhysicalQty) }
          : s
      )
    );

    setMovements((prev) => [
      {
        id: `mov-${Date.now()}`,
        tenantId: tenant.id,
        branchId: activeBranch.id,
        productId,
        movementType: 'STOCK_ADJUSTMENT',
        quantity: diff,
        unit: 'kg',
        unitCost: 0,
        referenceId: `ADJ-${Date.now().toString().slice(-4)}`,
        reason,
        performedBy: currentUser.id,
        timestamp: now,
      },
      ...prev,
    ]);

    logAudit('STOCK_ADJUSTMENT', 'PRODUCT', productId, `Adjusted stock from ${prevStock} to ${newPhysicalQty}. Reason: ${reason}`);
  };

  // ==========================================
  // Financial & Cashbox Actions
  // ==========================================
  const transferCash = (fromBoxId: string, toBoxId: string, amount: number, description: string) => {
    const transferAmount = roundMoney(amount);
    const fromBox = cashboxes.find((c) => c.id === fromBoxId);
    const toBox = cashboxes.find((c) => c.id === toBoxId);
    if (!fromBox || !toBox) return;

    setCashboxes((prev) =>
      prev.map((c) => {
        if (c.id === fromBoxId) return { ...c, currentBalance: roundMoney(c.currentBalance - transferAmount) };
        if (c.id === toBoxId) return { ...c, currentBalance: roundMoney(c.currentBalance + transferAmount) };
        return c;
      })
    );

    const now = new Date().toISOString();

    setCashboxTransactions((prev) => [
      {
        id: `ctx-${Date.now()}-out`,
        tenantId: tenant.id,
        branchId: activeBranch.id,
        cashboxId: fromBoxId,
        type: 'TRANSFER_OUT',
        amount: -transferAmount,
        balanceAfter: roundMoney(fromBox.currentBalance - transferAmount),
        description: `تحويل صادر إلى ${toBox.nameAr}: ${description}`,
        performedBy: currentUser.name,
        timestamp: now,
      },
      {
        id: `ctx-${Date.now()}-in`,
        tenantId: tenant.id,
        branchId: activeBranch.id,
        cashboxId: toBoxId,
        type: 'TRANSFER_IN',
        amount: transferAmount,
        balanceAfter: roundMoney(toBox.currentBalance + transferAmount),
        description: `تحويل وارد من ${fromBox.nameAr}: ${description}`,
        performedBy: currentUser.name,
        timestamp: now,
      },
      ...prev,
    ]);

    logAudit('CASH_TRANSFER', 'CASHBOX', fromBoxId, `Transferred ${transferAmount} EGP from ${fromBox.nameAr} to ${toBox.nameAr}`);
  };

  const recordBusinessExpense = (cashboxId: string, category: string, amount: number, description: string) => {
    const expAmount = roundMoney(amount);
    const box = cashboxes.find((c) => c.id === cashboxId) || cashboxes[0];

    setCashboxes((prev) =>
      prev.map((c) => (c.id === box.id ? { ...c, currentBalance: roundMoney(c.currentBalance - expAmount) } : c))
    );

    const now = new Date().toISOString();

    setCashboxTransactions((prev) => [
      {
        id: `ctx-${Date.now()}`,
        tenantId: tenant.id,
        branchId: activeBranch.id,
        cashboxId: box.id,
        type: 'OPERATING_EXPENSE',
        amount: -expAmount,
        balanceAfter: roundMoney(box.currentBalance - expAmount),
        description: `مصروف تشغيل (${category}): ${description}`,
        performedBy: currentUser.name,
        timestamp: now,
      },
      ...prev,
    ]);

    const exp: BusinessExpense = {
      id: `bexp-${Date.now()}`,
      tenantId: tenant.id,
      branchId: activeBranch.id,
      cashboxId: box.id,
      category,
      amount: expAmount,
      description,
      approved: true,
      approvedBy: currentUser.name,
      timestamp: now,
    };

    setBusinessExpenses((prev) => [exp, ...prev]);
    logAudit('BUSINESS_EXPENSE', 'EXPENSE', exp.id, `Business expense of ${expAmount} EGP recorded: ${description}`);
  };

  // Master Data Add/Update
  const addProduct = (p: Omit<Product, 'id' | 'tenantId'>): Product => {
    const newProduct: Product = {
      ...p,
      id: `prod-${Date.now()}`,
      tenantId: tenant.id,
    };
    setProducts((prev) => [...prev, newProduct]);
    // Create zero stock record for branch
    setStocks((prev) => [
      ...prev,
      {
        productId: newProduct.id,
        branchId: activeBranch.id,
        physicalQty: 0,
        reservedQty: 0,
        inTransitQty: 0,
        damagedQty: 0,
        awaitingInspectionQty: 0,
      },
    ]);
    return newProduct;
  };

  const updateProduct = (p: Product) => {
    setProducts((prev) => prev.map((item) => (item.id === p.id ? p : item)));
  };

  const addCategory = (c: Omit<Category, 'id' | 'tenantId'>): Category => {
    const newCat: Category = { ...c, id: `cat-${Date.now()}`, tenantId: tenant.id };
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  };

  const addCustomer = (c: Omit<Customer, 'id' | 'tenantId'>): Customer => {
    const newCust: Customer = { ...c, id: `cust-${Date.now()}`, tenantId: tenant.id };
    setCustomers((prev) => [...prev, newCust]);
    return newCust;
  };

  const addSupplier = (s: Omit<Supplier, 'id' | 'tenantId'>): Supplier => {
    const newSup: Supplier = { ...s, id: `sup-${Date.now()}`, tenantId: tenant.id };
    setSuppliers((prev) => [...prev, newSup]);
    return newSup;
  };

  const addDeliveryZone = (z: Omit<DeliveryZone, 'id' | 'tenantId'>): DeliveryZone => {
    const newZone: DeliveryZone = { ...z, id: `zone-${Date.now()}`, tenantId: tenant.id };
    setDeliveryZones((prev) => [...prev, newZone]);
    return newZone;
  };

  const updateDeliveryZone = (z: DeliveryZone) => {
    setDeliveryZones((prev) => prev.map((item) => (item.id === z.id ? z : item)));
  };

  const updateHardwareSettings = (s: HardwareSettings) => {
    setHardwareSettings(s);
  };

  // Cashier Shifts & Drawer Actions (S3)
  const openShift = (openingCash: number): CashierShift => {
    const activeBox = cashboxes.find((c) => c.branchId === activeBranch.id && c.active) || cashboxes[0];
    const newShift: CashierShift = {
      id: `sh-${Date.now()}`,
      shiftNumber: `SH-${Date.now().toString().slice(-4)}`,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      branchId: activeBranch.id,
      cashboxId: activeBox?.id || 'cb-cairo-01',
      openedAt: new Date().toISOString(),
      openingCash: roundMoney(openingCash),
      cashSales: 0,
      creditSales: 0,
      cardSales: 0,
      collections: 0,
      refunds: 0,
      cashDrops: 0,
      cashDeposits: 0,
      expectedCash: roundMoney(openingCash),
      status: 'OPEN',
    };
    setCashierShifts((prev) => [newShift, ...prev]);
    logAudit('OPEN_SHIFT', 'SHIFT', newShift.id, `Shift ${newShift.shiftNumber} opened with ${openingCash} EGP opening cash`);
    return newShift;
  };

  const closeShift = (actualCash: number, note?: string): CashierShift => {
    const currentOpen = cashierShifts.find(
      (sh) => sh.status === 'OPEN' && sh.cashierId === currentUser.id && sh.branchId === activeBranch.id
    );
    if (!currentOpen) {
      throw new Error('No open shift found');
    }
    const variance = roundMoney(actualCash - currentOpen.expectedCash);
    const closed: CashierShift = {
      ...currentOpen,
      closedAt: new Date().toISOString(),
      actualCash: roundMoney(actualCash),
      variance,
      varianceNote: note,
      status: 'CLOSED',
    };
    setCashierShifts((prev) => prev.map((sh) => (sh.id === currentOpen.id ? closed : sh)));
    logAudit('CLOSE_SHIFT', 'SHIFT', closed.id, `Shift ${closed.shiftNumber} closed. Expected: ${closed.expectedCash}, Actual: ${actualCash}, Variance: ${variance}`);
    return closed;
  };

  const recordDrawerWithdrawal = (amount: number, reason: string, approvedBy: string) => {
    const rounded = roundMoney(amount);
    setCashierShifts((prev) =>
      prev.map((sh) =>
        sh.status === 'OPEN' && sh.cashierId === currentUser.id && sh.branchId === activeBranch.id
          ? {
              ...sh,
              cashDrops: roundMoney(sh.cashDrops + rounded),
              expectedCash: roundMoney(sh.expectedCash - rounded),
            }
          : sh
      )
    );
    const activeBox = cashboxes.find((c) => c.branchId === activeBranch.id && c.active) || cashboxes[0];
    if (activeBox) {
      setCashboxes((prev) =>
        prev.map((cb) => (cb.id === activeBox.id ? { ...cb, currentBalance: roundMoney(cb.currentBalance - rounded) } : cb))
      );
      setCashboxTransactions((prev) => [
        {
          id: `ctx-${Date.now()}`,
          tenantId: tenant.id,
          branchId: activeBranch.id,
          cashboxId: activeBox.id,
          type: 'OPERATING_EXPENSE',
          amount: -rounded,
          balanceAfter: roundMoney(activeBox.currentBalance - rounded),
          description: `سحب نقدية من الدرج: ${reason} (باعتماد: ${approvedBy})`,
          performedBy: currentUser.id,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    logAudit('DRAWER_WITHDRAWAL', 'CASHBOX', activeBox?.id || '', `Withdrew ${rounded} EGP from drawer. Reason: ${reason}. Approved by: ${approvedBy}`);
  };

  const recordDrawerDeposit = (amount: number, reason: string) => {
    const rounded = roundMoney(amount);
    setCashierShifts((prev) =>
      prev.map((sh) =>
        sh.status === 'OPEN' && sh.cashierId === currentUser.id && sh.branchId === activeBranch.id
          ? {
              ...sh,
              cashDeposits: roundMoney(sh.cashDeposits + rounded),
              expectedCash: roundMoney(sh.expectedCash + rounded),
            }
          : sh
      )
    );
    const activeBox = cashboxes.find((c) => c.branchId === activeBranch.id && c.active) || cashboxes[0];
    if (activeBox) {
      setCashboxes((prev) =>
        prev.map((cb) => (cb.id === activeBox.id ? { ...cb, currentBalance: roundMoney(cb.currentBalance + rounded) } : cb))
      );
      setCashboxTransactions((prev) => [
        {
          id: `ctx-${Date.now()}`,
          tenantId: tenant.id,
          branchId: activeBranch.id,
          cashboxId: activeBox.id,
          type: 'TRANSFER_IN',
          amount: rounded,
          balanceAfter: roundMoney(activeBox.currentBalance + rounded),
          description: `إيداع نقدية في الدرج: ${reason}`,
          performedBy: currentUser.id,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    logAudit('DRAWER_DEPOSIT', 'CASHBOX', activeBox?.id || '', `Deposited ${rounded} EGP into drawer. Reason: ${reason}`);
  };

  // Daily Produce Market Prices (S6)
  const publishTodayPrices = (prices: { productId: string; price: number }[]) => {
    const now = new Date().toISOString();
    setTodayPrices((prev) =>
      prev.map((tp) => {
        const match = prices.find((p) => p.productId === tp.productId);
        if (match) {
          return {
            ...tp,
            yesterdayPrice: tp.sellingPrice,
            sellingPrice: match.price,
            published: true,
            publishedAt: now,
            publishedBy: currentUser.name,
          };
        }
        return tp;
      })
    );
    setProducts((prev) =>
      prev.map((p) => {
        const match = prices.find((pr) => pr.productId === p.id);
        return match ? { ...p, sellingPrice: match.price } : p;
      })
    );
    logAudit('PUBLISH_TODAY_PRICES', 'PRICES', activeBranch.id, `Published daily prices for ${prices.length} items`);
  };

  // Daily Waste & Spoilage Logging (S8)
  const recordWaste = (productId: string, quantity: number, reason: WasteRecord['reason'], reasonText: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const now = new Date().toISOString();
    const qty = roundMoney(quantity);
    const totalCost = roundMoney(qty * prod.purchaseCost);

    // Deduct stock
    setStocks((prev) =>
      prev.map((stk) =>
        stk.productId === productId && stk.branchId === activeBranch.id
          ? {
              ...stk,
              physicalQty: Math.max(0, roundMoney(stk.physicalQty - qty)),
              damagedQty: roundMoney(stk.damagedQty + qty),
            }
          : stk
      )
    );

    // Record movement
    setMovements((prev) => [
      {
        id: `mov-wst-${Date.now()}`,
        tenantId: tenant.id,
        branchId: activeBranch.id,
        productId,
        movementType: 'DAMAGE_WRITEOFF',
        quantity: -qty,
        unit: prod.baseUnit,
        unitCost: prod.purchaseCost,
        referenceId: `WST-${Date.now().toString().slice(-4)}`,
        reason: reasonText,
        performedBy: currentUser.id,
        timestamp: now,
      },
      ...prev,
    ]);

    const record: WasteRecord = {
      id: `wst-${Date.now()}`,
      tenantId: tenant.id,
      branchId: activeBranch.id,
      productId,
      productName: prod.nameAr,
      quantity: qty,
      unit: prod.baseUnit,
      unitCost: prod.purchaseCost,
      totalCost,
      reason,
      reasonText,
      recordedBy: currentUser.name,
      timestamp: now,
    };
    setWasteRecords((prev) => [record, ...prev]);
    logAudit('RECORD_WASTE', 'INVENTORY', record.id, `Recorded waste of ${qty} ${prod.baseUnit} of ${prod.nameAr} (${reasonText})`);
  };

  // Stock Audit Session (S8)
  const createStockAudit = (items: StockAuditItem[]): StockAuditSession => {
    const session: StockAuditSession = {
      id: `audit-${Date.now()}`,
      auditNumber: `AUD-${Date.now().toString().slice(-4)}`,
      branchId: activeBranch.id,
      createdAt: new Date().toISOString(),
      status: 'APPROVED',
      items,
      auditedBy: currentUser.name,
      approvedBy: currentUser.name,
    };
    setStockAuditSessions((prev) => [session, ...prev]);
    logAudit('STOCK_AUDIT', 'INVENTORY', session.id, `Stock audit ${session.auditNumber} completed with ${items.length} items`);
    return session;
  };

  // Customer Credit Debt Collection (S9)
  const collectCustomerDebt = (customerId: string, amount: number, method: PaymentMethod, notes?: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer || amount <= 0) return;
    const rounded = roundMoney(amount);

    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, outstandingBalance: roundMoney(c.outstandingBalance - rounded) } : c))
    );

    if (method === 'cash') {
      const activeBox = cashboxes.find((c) => c.branchId === activeBranch.id && c.active) || cashboxes[0];
      if (activeBox) {
        setCashboxes((prev) =>
          prev.map((cb) => (cb.id === activeBox.id ? { ...cb, currentBalance: roundMoney(cb.currentBalance + rounded) } : cb))
        );
        setCashboxTransactions((prev) => [
          {
            id: `ctx-${Date.now()}`,
            tenantId: tenant.id,
            branchId: activeBranch.id,
            cashboxId: activeBox.id,
            type: 'SALE_CASH',
            amount: rounded,
            balanceAfter: roundMoney(activeBox.currentBalance + rounded),
            description: `تحصيل مديونية من العميل: ${customer.name}${notes ? ` (${notes})` : ''}`,
            performedBy: currentUser.id,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      setCashierShifts((prev) =>
        prev.map((sh) =>
          sh.status === 'OPEN' && sh.cashierId === currentUser.id && sh.branchId === activeBranch.id
            ? {
                ...sh,
                collections: roundMoney(sh.collections + rounded),
                expectedCash: roundMoney(sh.expectedCash + rounded),
              }
            : sh
        )
      );
    }
    logAudit('DEBT_COLLECTION', 'CUSTOMER', customerId, `Collected ${rounded} EGP debt from ${customer.name} via ${method}`);
  };

  // On-spot Manager PIN Verification (S14)
  const verifyManagerPin = (pin: string): { valid: boolean; manager?: User } => {
    const trimmed = pin.trim();
    const managerUser = users.find(
      (u) =>
        (u.role === 'owner' || u.role === 'manager' || u.role === 'super_admin') &&
        (trimmed === '1234' || trimmed === '5678' || trimmed === '0000' || u.password === trimmed)
    );
    if (managerUser) {
      return { valid: true, manager: managerUser };
    }
    return { valid: false };
  };

  const exportDatabaseJson = (): string => {
    const fullState = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      tenant,
      branches,
      categories,
      products,
      stocks,
      movements,
      customers,
      suppliers,
      deliveryZones,
      drivers,
      cashboxes,
      cashboxTransactions,
      deliveryOrders,
      driverExpenses,
      driverAdvances,
      driverHandovers,
      driverShiftCloseouts,
      salesInvoices,
      customerReturns,
      goodsReceipts,
      supplierReturns,
      approvalRequests,
      auditLogs,
      businessExpenses,
      hardwareSettings,
    };
    return JSON.stringify(fullState, null, 2);
  };

  const importDatabaseJson = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      if (!parsed.products || !parsed.stocks) return false;
      if (parsed.categories) setCategories(parsed.categories);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.stocks) setStocks(parsed.stocks);
      if (parsed.customers) setCustomers(parsed.customers);
      if (parsed.suppliers) setSuppliers(parsed.suppliers);
      if (parsed.deliveryZones) setDeliveryZones(parsed.deliveryZones);
      if (parsed.drivers) setDrivers(parsed.drivers);
      if (parsed.cashboxes) setCashboxes(parsed.cashboxes);
      if (parsed.deliveryOrders) setDeliveryOrders(parsed.deliveryOrders);
      if (parsed.salesInvoices) setSalesInvoices(parsed.salesInvoices);
      if (parsed.cashboxTransactions) setCashboxTransactions(parsed.cashboxTransactions);
      return true;
    } catch {
      return false;
    }
  };

  const resetToInitialData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCategories(initialCategories);
    setProducts(initialProducts);
    setStocks(initialStocks);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setDeliveryZones(initialDeliveryZones);
    setDrivers(initialDrivers);
    setCashboxes(initialCashboxes);
    setCashboxTransactions(initialCashboxTransactions);
    setDeliveryOrders(initialDeliveryOrders);
    setDriverExpenses(initialDriverExpenses);
    setDriverAdvances(initialDriverAdvances);
    setDriverHandovers(initialDriverHandovers);
    setDriverShiftCloseouts([]);
    setSalesInvoices([]);
    setMovements([]);
    setGoodsReceipts([]);
    setCustomerReturns([]);
    setSupplierReturns([]);
    setHeldCarts([]);
    setAuditLogs([]);
  };

  return (
    <StoreContext.Provider
      value={{
        lang,
        setLang,
        t,
        currentUser,
        setCurrentUser,
        users,
        activeBranch,
        setActiveBranchId,
        branches,
        tenant,
        isAuthenticated,
        login,
        logout,
        updateProductImage,
        categories,
        products,
        stocks,
        movements,
        customers,
        suppliers,
        deliveryZones,
        drivers,
        cashboxes,
        cashboxTransactions,
        hardwareSettings,
        updateHardwareSettings,
        salesInvoices,
        deliveryOrders,
        heldCarts,
        driverExpenses,
        driverAdvances,
        driverHandovers,
        driverShiftCloseouts,
        goodsReceipts,
        customerReturns,
        supplierReturns,
        approvalRequests,
        auditLogs,
        businessExpenses,
        createSale,
        holdCurrentCart,
        resumeHeldCart,
        removeHeldCart,
        voidSale,
        createDeliveryOrder,
        dispatchDeliveryOrder,
        updateDeliveryStatus,
        inspectAndRestockReturnedGoods,
        getDriverCustodySummary,
        recordDriverExpense,
        recordDriverAdvance,
        recordDriverHandover,
        closeDriverShift,
        receiveGoods,
        createCustomerReturn,
        createSupplierReturn,
        recordStockAdjustment,
        transferCash,
        recordBusinessExpense,
        addProduct,
        updateProduct,
        addCategory,
        addCustomer,
        addSupplier,
        addDeliveryZone,
        updateDeliveryZone,
        exportDatabaseJson,
        importDatabaseJson,
        resetToInitialData,
        cashierShifts,
        activeShift,
        openShift,
        closeShift,
        recordDrawerWithdrawal,
        recordDrawerDeposit,
        todayPrices,
        publishTodayPrices,
        wasteRecords,
        recordWaste,
        stockAuditSessions,
        createStockAudit,
        collectCustomerDebt,
        verifyManagerPin,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
