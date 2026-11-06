import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { formatMoney, roundMoney } from '../../utils/accounting.ts';
import {
  Coins,
  Bike,
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  History,
  FileSpreadsheet,
  PackageCheck,
  Plus,
  Send,
  X,
  CreditCard,
  Layers,
} from 'lucide-react';

export const DriverCustodyScreen: React.FC = () => {
  const {
    lang,
    t,
    drivers,
    deliveryOrders,
    driverExpenses,
    driverAdvances,
    driverHandovers,
    driverShiftCloseouts,
    cashboxes,
    getDriverCustodySummary,
    recordDriverHandover,
    closeDriverShift,
    recordDriverAdvance,
    inspectAndRestockReturnedGoods,
  } = useStore();

  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || 'drv-ahmed');

  // Modals
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverAmount, setHandoverAmount] = useState('');
  const [handoverCashboxId, setHandoverCashboxId] = useState(cashboxes[0]?.id || '');
  const [handoverNotes, setHandoverNotes] = useState('');

  const [closeoutModalOpen, setCloseoutModalOpen] = useState(false);
  const [actualCashHanded, setActualCashHanded] = useState('');
  const [discrepancyReason, setDiscrepancyReason] = useState('');

  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('سلفة فكة للمندوب');

  const currentDriver = drivers.find((d) => d.id === selectedDriverId) || drivers[0];
  const custody = getDriverCustodySummary(selectedDriverId);

  // Active items in transit for this driver
  const inTransitOrders = deliveryOrders.filter(
    (o) => o.assignedDriverId === selectedDriverId && (o.deliveryStatus === 'DISPATCHED' || o.deliveryStatus === 'ON_THE_WAY')
  );

  // Returned / failed orders awaiting inspection
  const returnedOrders = deliveryOrders.filter(
    (o) => o.assignedDriverId === selectedDriverId && (o.deliveryStatus === 'FAILED' || o.deliveryStatus === 'RETURNED')
  );

  // Past handovers for this driver
  const driverPastHandovers = driverHandovers.filter((h) => h.driverId === selectedDriverId);
  const driverPastCloseouts = driverShiftCloseouts.filter((s) => s.driverId === selectedDriverId);

  const handleHandoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(handoverAmount);
    if (!amount || amount <= 0) return;

    recordDriverHandover(selectedDriverId, amount, handoverCashboxId, handoverNotes);
    setHandoverAmount('');
    setHandoverNotes('');
    setHandoverModalOpen(false);
  };

  const handleAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(advanceAmount);
    if (!amount || amount <= 0) return;

    recordDriverAdvance(selectedDriverId, amount, handoverCashboxId, advanceReason);
    setAdvanceAmount('');
    setAdvanceModalOpen(false);
  };

  const handleCloseoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(actualCashHanded) || 0;
    closeDriverShift(selectedDriverId, actual, discrepancyReason);
    setActualCashHanded('');
    setDiscrepancyReason('');
    setCloseoutModalOpen(false);
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.delivery.custodyTitle}
            </h2>
            <span dir="ltr" className="hidden sm:inline text-xs text-slate-400 font-normal">
              (Driver Custody & Closeout)
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {t.delivery.reconciliationFormula}
          </p>
        </div>

        {/* Driver selector & quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800">
            <Bike className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'ar' ? 'المندوب:' : 'Driver:'}</span>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setAdvanceAmount('100');
              setAdvanceModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowDownRight className="w-4 h-4 text-blue-600" />
            <span>{t.delivery.recordAdvance}</span>
          </button>

          <button
            onClick={() => {
              setHandoverAmount(custody.expectedRemainingCashCustody.toString());
              setHandoverModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>{t.delivery.handoverToCashier}</span>
          </button>

          <button
            onClick={() => {
              setActualCashHanded(custody.expectedRemainingCashCustody.toString());
              setCloseoutModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <PackageCheck className="w-4 h-4" />
            <span>{t.delivery.closeShift}</span>
          </button>
        </div>
      </div>

      {/* Hero Summary Cards (The 10 Custody Buckets) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Cash in hand expected */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-emerald-100 font-semibold mb-1">
              {t.delivery.expectedCash}
            </div>
            <div className="text-2xl font-extrabold tracking-tight">
              {formatMoney(custody.expectedRemainingCashCustody, lang)}
            </div>
          </div>
          <div className="text-[11px] text-emerald-100/90 font-medium mt-2">
            مستحقة التوريد للكاشير
          </div>
        </div>

        {/* 2. Customer collections */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            {lang === 'ar' ? 'إجمالي تحصيلات العملاء' : 'Total Collected'}
          </div>
          <div className="text-lg font-bold text-slate-900">
            {formatMoney(custody.totalCashCollected, lang)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            طلبات: {custody.deliveredOrdersCount} مسلّمة
          </div>
        </div>

        {/* 3. Advances */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            {lang === 'ar' ? 'سلف نقدية وفكة مستلمة' : 'Cash Advances'}
          </div>
          <div className="text-lg font-bold text-blue-700">
            +{formatMoney(custody.cashAdvancesReceived, lang)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            من درج الكاشير
          </div>
        </div>

        {/* 4. Expenses */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            {lang === 'ar' ? 'مصروفات معتمدة بالعهدة' : 'Approved Expenses'}
          </div>
          <div className="text-lg font-bold text-amber-700">
            -{formatMoney(custody.approvedCashExpenses, lang)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            بنزين، كارتة، ركنات
          </div>
        </div>

        {/* 5. Previous handovers */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            {lang === 'ar' ? 'توريدات سابقة خلال الوردية' : 'Previous Handovers'}
          </div>
          <div className="text-lg font-bold text-purple-700">
            -{formatMoney(custody.previousCashHandovers, lang)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            تم إيداعها بدرج الكاشير
          </div>
        </div>
      </div>

      {/* Detailed Live Formula Breakdown Panel (Scenario I verification) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>{lang === 'ar' ? 'المعادلة المحاسبية المعتمدة للتقفيل (Scenario I)' : 'Audit Calculation Formula'}</span>
          <span className="text-emerald-700 font-mono font-bold text-xs bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {custody.totalCashCollected} + {custody.cashAdvancesReceived} - {custody.approvedCashExpenses} - {custody.previousCashHandovers} = {custody.expectedRemainingCashCustody} ج.م
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block">تحصيل الطلبيات</span>
            <span className="font-extrabold text-slate-800 text-sm">+{custody.totalCashCollected} ج.م</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block">سلف مستلمة</span>
            <span className="font-extrabold text-blue-700 text-sm">+{custody.cashAdvancesReceived} ج.م</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block">مصروفات معتمدة</span>
            <span className="font-extrabold text-amber-700 text-sm">-{custody.approvedCashExpenses} ج.م</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block">توريدات سابقة</span>
            <span className="font-extrabold text-purple-700 text-sm">-{custody.previousCashHandovers} ج.م</span>
          </div>
          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-300">
            <span className="text-[11px] text-emerald-800 font-bold block">صافي العهدة المطلوبة</span>
            <span className="font-extrabold text-emerald-800 text-base">{custody.expectedRemainingCashCustody} ج.م</span>
          </div>
        </div>
      </div>

      {/* Grid: Goods in Transit + Returned Goods Awaiting Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Goods in physical custody with driver */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">
                {t.delivery.goodsInTransit} ({inTransitOrders.length} طلبات)
              </h3>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
              بضاعة بيدك للتسليم
            </span>
          </div>

          {inTransitOrders.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              لا توجد بضائع في حوزة المندوب حالياً
            </div>
          ) : (
            <div className="space-y-2">
              {inTransitOrders.map((ord) => (
                <div key={ord.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex justify-between font-bold text-slate-800 mb-1">
                    <span>{ord.orderNumber} - {ord.customerName}</span>
                    <span className="text-emerald-700">{formatMoney(ord.totalAmount, lang)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {ord.items.map((it) => `${it.productNameAr} (${it.quantity} ${it.unit})`).join('، ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Returned Goods Awaiting Inspection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900">
                {t.delivery.returnedGoods} ({returnedOrders.length})
              </h3>
            </div>
            <span className="text-xs bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded">
              تتطلب فحص المخزن
            </span>
          </div>

          {returnedOrders.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              لا توجد بضائع مرتجعة معلقة
            </div>
          ) : (
            <div className="space-y-2">
              {returnedOrders.map((ord) => (
                <div key={ord.id} className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{ord.orderNumber} - {ord.customerName}</div>
                    <div className="text-[11px] text-red-600">السبب: {ord.failureReason || 'تعذر التسليم'}</div>
                  </div>
                  <button
                    onClick={() => inspectAndRestockReturnedGoods(ord.id)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    فحص وإعادة للمخزن
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* History Tables: Past Handovers & Closed Shifts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <span>{lang === 'ar' ? 'سجل توريدات وتقفيلات العهدة السابقة' : 'Custody Settlement History'}</span>
        </h3>

        {driverPastHandovers.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">لا توجد حركات سابقة لهذا المندوب</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-2 text-start">رقم الإيصال</th>
                  <th className="p-2 text-start">المبلغ المورد</th>
                  <th className="p-2 text-start">المستلم بالكاشير</th>
                  <th className="p-2 text-start">الوقت والتاريخ</th>
                  <th className="p-2 text-start">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {driverPastHandovers.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/80">
                    <td className="p-2 font-mono font-bold text-slate-800">{h.handoverNumber}</td>
                    <td className="p-2 font-extrabold text-emerald-700">{formatMoney(h.amount, lang)}</td>
                    <td className="p-2 font-medium text-slate-700">{h.receivedBy}</td>
                    <td className="p-2 text-slate-500">{new Date(h.timestamp).toLocaleString()}</td>
                    <td className="p-2 text-slate-500">{h.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Cash Handover to Cashier */}
      {handoverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <span>{t.delivery.handoverToCashier}</span>
              </h3>
              <button
                onClick={() => setHandoverModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHandoverSubmit} className="py-4 space-y-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-xs text-emerald-950 font-medium">
                تنبيه: التوريد يقلل عهدة المندوب النقدية ويزيد رصيد درج الكاشير المستلم فوراً دون تكرار احتساب المبيعات.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المبلغ المورد (ج.م) *
                </label>
                <input
                  type="number"
                  required
                  value={handoverAmount}
                  onChange={(e) => setHandoverAmount(e.target.value)}
                  className="w-full text-xl font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  إيداع في الخزينة / درج الكاشير
                </label>
                <select
                  value={handoverCashboxId}
                  onChange={(e) => setHandoverCashboxId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {cashboxes.map((cb) => (
                    <option key={cb.id} value={cb.id}>
                      {lang === 'ar' ? cb.nameAr : cb.nameEn} (رصيد: {formatMoney(cb.currentBalance, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات
                </label>
                <input
                  type="text"
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="مثال: توريد دفعة منتصف اليوم"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                {t.common.confirm}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Driver Shift Closeout with Discrepancy Reconciliation */}
      {closeoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-600" />
                <span>{t.delivery.closeShift}</span>
              </h3>
              <button
                onClick={() => setCloseoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseoutSubmit} className="py-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">المندوب:</span>
                  <span className="font-bold text-slate-800">{currentDriver.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.delivery.expectedCash}:</span>
                  <span className="font-extrabold text-slate-900">
                    {formatMoney(custody.expectedRemainingCashCustody, lang)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.delivery.actualHandover} (ج.م) *
                </label>
                <input
                  type="number"
                  required
                  value={actualCashHanded}
                  onChange={(e) => setActualCashHanded(e.target.value)}
                  className="w-full text-xl font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Live discrepancy calculation */}
              {(() => {
                const act = parseFloat(actualCashHanded) || 0;
                const diff = roundMoney(act - custody.expectedRemainingCashCustody);
                const isExact = Math.abs(diff) < 0.01;

                return (
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                      isExact
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : diff < 0
                        ? 'bg-red-50 border-red-300 text-red-800'
                        : 'bg-amber-50 border-amber-300 text-amber-800'
                    }`}
                  >
                    <span>{t.delivery.discrepancy}:</span>
                    <span className="text-sm">
                      {isExact
                        ? t.delivery.balanced
                        : diff < 0
                        ? `${t.delivery.shortage}: ${Math.abs(diff)} ج.م`
                        : `${t.delivery.surplus}: +${diff} ج.م`}
                    </span>
                  </div>
                );
              })()}

              {/* If shortage or discrepancy, require reason */}
              {Math.abs((parseFloat(actualCashHanded) || 0) - custody.expectedRemainingCashCustody) > 0.01 && (
                <div>
                  <label className="block text-xs font-bold text-red-700 mb-1">
                    بيان سبب العجز أو الزيادة (مطلوب لاعتماد الإدارة) *
                  </label>
                  <input
                    type="text"
                    required
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                    placeholder="مثال: فكة متبقية مع العميل أو خطأ في الحساب"
                    className="w-full bg-slate-50 border border-red-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
              >
                {lang === 'ar' ? 'تجميد وتقفيل الوردية نهائياً' : 'Freeze & Close Shift'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Cash Advance */}
      {advanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-blue-600" />
                <span>{t.delivery.recordAdvance}</span>
              </h3>
              <button
                onClick={() => setAdvanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdvanceSubmit} className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مبلغ السلفة (ج.م) *
                </label>
                <input
                  type="number"
                  required
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full text-xl font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  السبب
                </label>
                <input
                  type="text"
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                {t.common.confirm}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
