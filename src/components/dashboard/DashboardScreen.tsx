import React from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { formatMoney } from '../../utils/accounting.ts';
import { calculateAvailableStock } from '../../utils/inventory.ts';
import { TabId } from '../layout/Sidebar.tsx';
import {
  TrendingUp,
  ShoppingBag,
  Coins,
  Truck,
  AlertTriangle,
  Wallet,
  ArrowDownLeft,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface DashboardScreenProps {
  setActiveTab: (tab: TabId) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ setActiveTab }) => {
  const {
    lang,
    t,
    salesInvoices,
    deliveryOrders,
    products,
    stocks,
    cashboxes,
    customers,
    suppliers,
    drivers,
    activeBranch,
    auditLogs,
    currentUser,
  } = useStore();

  // Metrics from actual data
  const branchInvoices = salesInvoices.filter((i) => i.branchId === activeBranch.id && i.status === 'COMPLETED');
  const todaySalesTotal = branchInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalDiscounts = branchInvoices.reduce((sum, i) => sum + i.discount, 0);

  // Profit calculation from actual product moving costs
  const grossProfitTotal = branchInvoices.reduce((sum, inv) => {
    const invProfit = inv.items.reduce((itemSum, it) => {
      const revenue = it.total;
      const cost = it.quantity * it.purchaseCost;
      return itemSum + (revenue - cost);
    }, 0);
    return sum + invProfit;
  }, 0);

  // Cashbox total
  const totalCashboxBalance = cashboxes
    .filter((c) => c.branchId === activeBranch.id)
    .reduce((sum, c) => sum + c.currentBalance, 0);

  // Receivables & Payables
  const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + s.payableBalance, 0);

  // Low stock products
  const lowStockProducts = products.filter((p) => {
    const stock = stocks.find((s) => s.productId === p.id && s.branchId === activeBranch.id);
    if (!stock) return false;
    const avail = calculateAvailableStock(stock);
    return avail <= p.minStock;
  });

  // Active delivery orders
  const activeDeliveries = deliveryOrders.filter(
    (o) =>
      o.branchId === activeBranch.id &&
      (o.deliveryStatus === 'READY_FOR_DISPATCH' ||
        o.deliveryStatus === 'ASSIGNED' ||
        o.deliveryStatus === 'DISPATCHED' ||
        o.deliveryStatus === 'ON_THE_WAY')
  );

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
            {lang === 'ar' ? 'سوق الخضار والفاكهة النموذجي' : 'Al-Namouthagi Retail Platform'}
          </span>
          <h2 className="text-xl font-extrabold tracking-tight">
            {t.user.welcome}، {currentUser.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {lang === 'ar'
              ? 'مرحباً بك في لوحة القيادة الذكية لطلبية. جميع المؤشرات المالية والمخزنية مبنية على حركات فعلية موثقة.'
              : 'Real-time financial and inventory indicators calculated directly from transactions.'}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('pos')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.nav.pos} (F2)</span>
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>{t.delivery.newOrder}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t.reports.todaySales}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatMoney(todaySalesTotal, lang)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>فواتير: {branchInvoices.length}</span>
            <span>خصومات: {formatMoney(totalDiscounts, lang)}</span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t.reports.netProfit}</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-teal-700 tracking-tight">
            {formatMoney(grossProfitTotal, lang)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            محسوب بمتوسط التكلفة المرجح
          </div>
        </div>

        {/* Cashbox Balance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{lang === 'ar' ? 'رصيد الخزائن والأدراج' : 'Cashboxes Total'}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatMoney(totalCashboxBalance, lang)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            الفرع الرئيسي
          </div>
        </div>

        {/* Active Deliveries */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t.reports.openDeliveries}</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700 tracking-tight">
            {activeDeliveries.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>مناديب: {drivers.length}</span>
            <button
              onClick={() => setActiveTab('delivery')}
              className="text-purple-600 hover:underline font-bold text-[11px]"
            >
              عرض اللوحة
            </button>
          </div>
        </div>
      </div>

      {/* Second Row: Balances & Discrepancies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Customer Receivables */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-700">مستحقات العملاء (آجل / شكك)</span>
            <span className="text-base font-extrabold text-emerald-700">{formatMoney(totalReceivables, lang)}</span>
          </div>
          <p className="text-[11px] text-slate-500">مبالغ مستحقة على العملاء بانتظار التحصيل</p>
        </div>

        {/* Supplier Payables */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-700">مستحقات الموردين (التزامات)</span>
            <span className="text-base font-extrabold text-red-600">{formatMoney(totalPayables, lang)}</span>
          </div>
          <p className="text-[11px] text-slate-500">فواتير توريد خضار وفاكهة آجلة للموردين</p>
        </div>

        {/* Low Stock count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-700">أصناف تحتاج إعادة طلب</span>
            <span className="text-base font-extrabold text-amber-600">{lowStockProducts.length} أصناف</span>
          </div>
          <p className="text-[11px] text-slate-500">الرصيد المتاح يقل عن الحد الأدنى المحدد</p>
        </div>
      </div>

      {/* Grid: Low Stock Alert Table & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock Items */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">
                {lang === 'ar' ? 'تنبيهات المخزون وقرب النفاد' : 'Low Stock Alerts'}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
            >
              دليل المخزون &larr;
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              جميع المنتجات في الحدود الآمنة للمخزون
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((p) => {
                const stock = stocks.find((s) => s.productId === p.id && s.branchId === activeBranch.id);
                const avail = stock ? calculateAvailableStock(stock) : 0;
                return (
                  <div key={p.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{lang === 'ar' ? p.nameAr : p.nameEn}</div>
                      <div className="text-[11px] text-slate-500">حد إعادة الطلب: {p.minStock} {p.baseUnit}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 text-xs">
                      المتاح: {avail} {p.baseUnit}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Audit Log */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-sm text-slate-900">
                {lang === 'ar' ? 'أحدث العمليات وسجل التدقيق' : 'Recent Audit Activity'}
              </h3>
            </div>
            <span className="text-xs text-slate-400">حركات لحظية</span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              سيظهر هنا سجل تدقيق المعاملات الحية فور إجرائها
            </div>
          ) : (
            <div className="space-y-2">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">{log.details}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-medium">بواسطة: {log.actorName}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
