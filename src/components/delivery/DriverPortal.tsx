import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { DeliveryOrder } from '../../types/index.ts';
import { formatMoney } from '../../utils/accounting.ts';
import {
  Bike,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Banknote,
  Fuel,
  Navigation,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';

export const DriverPortal: React.FC = () => {
  const {
    lang,
    t,
    drivers,
    deliveryOrders,
    updateDeliveryStatus,
    getDriverCustodySummary,
    recordDriverExpense,
  } = useStore();

  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || 'drv-ahmed');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'fuel' | 'parking' | 'toll' | 'other'>('fuel');
  const [expenseDescription, setExpenseDescription] = useState('');

  // Delivery action modal
  const [actionOrder, setActionOrder] = useState<DeliveryOrder | null>(null);
  const [actionType, setActionType] = useState<'DELIVER' | 'FAIL' | null>(null);
  const [collectedAmount, setCollectedAmount] = useState('');
  const [failureReason, setFailureReason] = useState('العميل لم يرد على الهاتف');

  const currentDriver = drivers.find((d) => d.id === selectedDriverId) || drivers[0];
  const custody = getDriverCustodySummary(selectedDriverId);

  // Orders assigned to this driver
  const assignedOrders = deliveryOrders.filter((o) => o.assignedDriverId === selectedDriverId);
  const activeOrders = assignedOrders.filter(
    (o) => o.deliveryStatus === 'DISPATCHED' || o.deliveryStatus === 'ON_THE_WAY' || o.deliveryStatus === 'ASSIGNED'
  );
  const completedOrders = assignedOrders.filter(
    (o) => o.deliveryStatus === 'DELIVERED' || o.deliveryStatus === 'FAILED'
  );

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount);
    if (!amount || amount <= 0) return;
    recordDriverExpense(selectedDriverId, amount, expenseCategory, expenseDescription || 'مصروف طريق');
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseModalOpen(false);
  };

  const handleActionConfirm = () => {
    if (!actionOrder || !actionType) return;

    if (actionType === 'DELIVER') {
      const collected = parseFloat(collectedAmount) || 0;
      updateDeliveryStatus(actionOrder.id, 'DELIVERED', {
        collectedAmount: collected,
      });
    } else {
      updateDeliveryStatus(actionOrder.id, 'FAILED', {
        failureReason,
      });
    }

    setActionOrder(null);
    setActionType(null);
  };

  return (
    <div className="max-w-md mx-auto p-3 space-y-3 pb-16">
      {/* Driver Switcher Simulation Bar */}
      <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Bike className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">
              {lang === 'ar' ? 'واجهة المندوب المحمولة' : 'Driver Mobile App'}
            </div>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="font-bold text-sm bg-transparent text-white focus:outline-none cursor-pointer"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id} className="text-slate-900">
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setExpenseModalOpen(true)}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
        >
          <Fuel className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'مصروف' : 'Expense'}</span>
        </button>
      </div>

      {/* Custody In-Hand Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-emerald-100">
            {lang === 'ar' ? 'النقدية المحصلة بيدك الآن (العهدة)' : 'Cash in Hand (Custody)'}
          </span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
            {activeOrders.length} {lang === 'ar' ? 'طلبات جارية' : 'Active'}
          </span>
        </div>

        <div className="text-2xl font-extrabold tracking-tight">
          {formatMoney(custody.expectedRemainingCashCustody, lang)}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/20 text-xs">
          <div>
            <div className="text-[10px] text-emerald-100">{lang === 'ar' ? 'التحصيلات' : 'Collected'}</div>
            <div className="font-bold">{formatMoney(custody.totalCashCollected, lang)}</div>
          </div>
          <div>
            <div className="text-[10px] text-emerald-100">{lang === 'ar' ? 'السلف' : 'Advances'}</div>
            <div className="font-bold">{formatMoney(custody.cashAdvancesReceived, lang)}</div>
          </div>
          <div>
            <div className="text-[10px] text-emerald-100">{lang === 'ar' ? 'المصروفات' : 'Expenses'}</div>
            <div className="font-bold">{formatMoney(custody.approvedCashExpenses, lang)}</div>
          </div>
        </div>
      </div>

      {/* Active Orders Section */}
      <div className="space-y-2">
        <h3 className="font-bold text-sm text-slate-800 flex items-center justify-between">
          <span>{lang === 'ar' ? 'الطلبيات الجارية للتسليم' : 'Active Deliveries'}</span>
          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
            {activeOrders.length}
          </span>
        </h3>

        {activeOrders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              {lang === 'ar' ? 'لا توجد طلبيات معلقة حالياً' : 'All deliveries completed!'}
            </p>
          </div>
        ) : (
          activeOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                  {order.orderNumber}
                </span>
                <span className="text-xs font-extrabold text-emerald-700">
                  {formatMoney(order.totalAmount, lang)}
                </span>
              </div>

              {/* Customer and address */}
              <div className="space-y-1.5 text-xs">
                <div className="font-bold text-slate-900 text-sm">{order.customerName}</div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="font-bold text-emerald-700 underline"
                    dir="ltr"
                  >
                    {order.customerPhone}
                  </a>
                </div>
                <div className="flex items-start gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{order.deliveryAddress}</span>
                </div>
                {order.customerInstructions && (
                  <div className="text-[11px] bg-amber-50 text-amber-900 p-2 rounded-lg font-medium border border-amber-200">
                    ملاحظة: {order.customerInstructions}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setActionOrder(order);
                    setActionType('DELIVER');
                    setCollectedAmount(order.totalAmount.toString());
                  }}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تم التسليم والتحصيل' : 'Delivered & Collect'}</span>
                </button>

                <button
                  onClick={() => {
                    setActionOrder(order);
                    setActionType('FAIL');
                  }}
                  className="py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'فشل التسليم / إرجاع' : 'Failed / Return'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Deliver or Fail Action */}
      {actionOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {actionType === 'DELIVER'
                  ? (lang === 'ar' ? 'إثبات التسليم وتحصيل النقدية' : 'Confirm Delivery & Collection')
                  : (lang === 'ar' ? 'إثبات تعذر التسليم وإعادة الطلب' : 'Report Failed Delivery')}
              </h3>
              <button
                onClick={() => setActionOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {actionType === 'DELIVER' ? (
                <>
                  <div className="bg-emerald-50 p-3 rounded-xl flex justify-between items-center text-xs font-bold text-emerald-950">
                    <span>قيمة الطلبية:</span>
                    <span className="text-base">{formatMoney(actionOrder.totalAmount, lang)}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {lang === 'ar' ? 'المبلغ الفعلي المحصل من العميل' : 'Cash Collected'} (ج.م)
                    </label>
                    <input
                      type="number"
                      value={collectedAmount}
                      onChange={(e) => setCollectedAmount(e.target.value)}
                      className="w-full text-xl font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setCollectedAmount(actionOrder.totalAmount.toString())}
                      className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      {lang === 'ar' ? 'المبلغ بالكامل' : 'Full Amount'}
                    </button>
                    <button
                      onClick={() => setCollectedAmount('0')}
                      className="flex-1 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      {lang === 'ar' ? 'آجل (0 ج.م)' : 'Unpaid Credit'}
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'سبب عدم التسليم' : 'Failure Reason'}
                  </label>
                  <select
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="العميل لم يرد على الهاتف">العميل لم يرد على الهاتف</option>
                    <option value="رفض العميل استلام الطلب">رفض العميل استلام الطلب</option>
                    <option value="العنوان غير صحيح أو غير واضح">العنوان غير صحيح أو غير واضح</option>
                    <option value="طلب العميل التأجيل لموعد آخر">طلب العميل التأجيل لموعد آخر</option>
                  </select>
                </div>
              )}

              <button
                onClick={handleActionConfirm}
                className={`w-full py-2.5 font-bold rounded-xl text-xs text-white transition-colors cursor-pointer shadow-sm ${
                  actionType === 'DELIVER' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {t.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Roadside Expense Submission */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Fuel className="w-5 h-5 text-emerald-600" />
                <span>{lang === 'ar' ? 'تسجيل مصروف طريق' : 'Record Road Expense'}</span>
              </h3>
              <button
                onClick={() => setExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'المبلغ المدفوع' : 'Amount'} (ج.م) *
                </label>
                <input
                  type="number"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="50"
                  className="w-full text-lg font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'بند المصروف' : 'Category'}
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="fuel">بنزين ومحروقات</option>
                  <option value="parking">ركنة / باركينج</option>
                  <option value="toll">كارتة طريق ورسوم</option>
                  <option value="other">مصروفات أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'البيان / الوصف' : 'Description'}
                </label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="مثال: تموين بنزين 92 للموتوسيكل"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                {t.common.save}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
