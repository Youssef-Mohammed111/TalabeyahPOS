import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { formatMoney, roundMoney } from '../../utils/accounting.ts';
import {
  DollarSign,
  Wallet,
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  History,
  ShieldCheck,
  X,
  CreditCard,
  Building,
} from 'lucide-react';

export const CashboxScreen: React.FC = () => {
  const {
    lang,
    t,
    cashboxes,
    cashboxTransactions,
    transferCash,
    recordBusinessExpense,
    activeBranch,
  } = useStore();

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [fromBoxId, setFromBoxId] = useState(cashboxes[0]?.id || '');
  const [toBoxId, setToBoxId] = useState(cashboxes[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('توريد نقدية فائضة للخزينة الرئيسية');

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseCashboxId, setExpenseCashboxId] = useState(cashboxes[0]?.id || '');
  const [expenseCategory, setExpenseCategory] = useState('مصاريف نظافة وأكياس تعبئة');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');

  const branchCashboxes = cashboxes.filter((c) => c.branchId === activeBranch.id);
  const branchTransactions = cashboxTransactions.filter((tx) => tx.branchId === activeBranch.id);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0 || fromBoxId === toBoxId) return;

    transferCash(fromBoxId, toBoxId, amount, transferDesc);
    setTransferAmount('');
    setTransferModalOpen(false);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount);
    if (!amount || amount <= 0) return;

    recordBusinessExpense(expenseCashboxId, expenseCategory, amount, expenseDesc || expenseCategory);
    setExpenseAmount('');
    setExpenseDesc('');
    setExpenseModalOpen(false);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SALE_CASH':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">إيراد مبيعات</span>;
      case 'DELIVERY_HANDOVER':
        return <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px]">توريد عهدة مندوب</span>;
      case 'TRANSFER_IN':
        return <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">تحويل وارد</span>;
      case 'TRANSFER_OUT':
        return <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded text-[10px]">تحويل صادر</span>;
      case 'OPERATING_EXPENSE':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">مصروف تشغيل</span>;
      case 'DRIVER_ADVANCE':
        return <span className="bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded text-[10px]">سلفة مندوب</span>;
      case 'SUPPLIER_PAYMENT':
        return <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[10px]">سداد مورد</span>;
      case 'CUSTOMER_REFUND':
        return <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">رد نقدية لعميل</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">{type}</span>;
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>{t.finance.cashboxTitle} (Cash Management & Ledger)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'ar'
              ? 'إدارة الأدراج والخزائن، التحويلات الداخلية، المصروفات وفصل حركة المبيعات عن توريدات العهدة'
              : 'Cashboxes, internal transfers, business expenses and audit ledger'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-600" />
            <span>{t.finance.recordExpense}</span>
          </button>

          <button
            onClick={() => setTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{t.finance.cashTransfer}</span>
          </button>
        </div>
      </div>

      {/* Cashbox Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branchCashboxes.map((cb) => (
          <div key={cb.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                  {cb.id === 'cb-cashier-1' ? 'درج البيع المباشر' : 'خزينة الفرع'}
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  {lang === 'ar' ? cb.nameAr : cb.nameEn}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  رصيد افتتاحي: {formatMoney(cb.openingBalance, lang)}
                </div>
              </div>
            </div>

            <div className="text-end">
              <span className="text-xs text-slate-500 font-semibold block">{t.finance.currentBalance}</span>
              <span className="text-2xl font-extrabold text-slate-900">
                {formatMoney(cb.currentBalance, lang)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
          <span>{t.finance.recentTransactions}</span>
          <span className="text-xs text-slate-500 font-medium">عدد الحركات: {branchTransactions.length}</span>
        </div>

        {branchTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">لا توجد حركات نقدية مسجلة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">نوع الحركة</th>
                  <th className="p-3 text-start">البيان والوصف</th>
                  <th className="p-3 text-start">المبلغ</th>
                  <th className="p-3 text-start">الرصيد بعد الحركة</th>
                  <th className="p-3 text-start">القائم بالعملية</th>
                  <th className="p-3 text-start">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchTransactions.map((tx) => {
                  const isInflow = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80">
                      <td className="p-3">{getTypeBadge(tx.type)}</td>
                      <td className="p-3 font-medium text-slate-800">{tx.description}</td>
                      <td className={`p-3 font-extrabold text-sm ${isInflow ? 'text-emerald-700' : 'text-red-600'}`}>
                        {isInflow ? `+${formatMoney(tx.amount, lang)}` : formatMoney(tx.amount, lang)}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {formatMoney(tx.balanceAfter, lang)}
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{tx.performedBy}</td>
                      <td className="p-3 text-slate-400">{new Date(tx.timestamp).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Cash Transfer */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-600" />
                <span>{t.finance.cashTransfer}</span>
              </h3>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">من خزينة / درج</label>
                <select
                  value={fromBoxId}
                  onChange={(e) => setFromBoxId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                >
                  {branchCashboxes.map((cb) => (
                    <option key={cb.id} value={cb.id}>
                      {cb.nameAr} ({formatMoney(cb.currentBalance, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">إلى خزينة / درج</label>
                <select
                  value={toBoxId}
                  onChange={(e) => setToBoxId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                >
                  {branchCashboxes.map((cb) => (
                    <option key={cb.id} value={cb.id}>
                      {cb.nameAr} ({formatMoney(cb.currentBalance, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المحول (ج.م) *</label>
                <input
                  type="number"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full text-xl font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">بيان التحويل</label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
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

      {/* Modal: Record Operating Expense */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-600" />
                <span>{t.finance.recordExpense}</span>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">الخزينة المخصوم منها</label>
                <select
                  value={expenseCashboxId}
                  onChange={(e) => setExpenseCashboxId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                >
                  {branchCashboxes.map((cb) => (
                    <option key={cb.id} value={cb.id}>
                      {cb.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">بند المصروف</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                >
                  <option value="نظافة ومستلزمات">نظافة ومستلزمات</option>
                  <option value="أكياس تعبئة وكرتون">أكياس تعبئة وكرتون</option>
                  <option value="كهرباء ومياه وغاز">كهرباء ومياه وغاز</option>
                  <option value="نثريات وضيافة">نثريات وضيافة</option>
                  <option value="إيجار وصيانة">إيجار وصيانة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ (ج.م) *</label>
                <input
                  type="number"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full text-xl font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف المصروف</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="مثال: شراء كرتونة أكياس مقاس وسط"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
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
