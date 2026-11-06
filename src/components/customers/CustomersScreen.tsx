import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { Customer, PaymentMethod } from '../../types/index.ts';
import {
  Users,
  Search,
  Plus,
  DollarSign,
  Printer,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowDownLeft,
} from 'lucide-react';

export const CustomersScreen: React.FC = () => {
  const { customers, collectCustomerDebt, activeBranch, currentUser } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Collect modal state
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [collectNote, setCollectNote] = useState('سداد دفعة من الحساب الآجل');

  // Print voucher state
  const [printedVoucher, setPrintedVoucher] = useState<{
    customerName: string;
    amount: number;
    date: Date;
    method: string;
    collector: string;
  } | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const totalOutstandingDebt = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);

  const handleOpenCollect = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCollectAmount((cust.outstandingBalance || 0).toString());
    setShowCollectModal(true);
  };

  const handleConfirmCollect = () => {
    const amt = parseFloat(collectAmount);
    if (!selectedCustomer || !amt || amt <= 0) return;

    collectCustomerDebt(selectedCustomer.id, amt, paymentMethod, collectNote);
    setShowCollectModal(false);

    setPrintedVoucher({
      customerName: selectedCustomer.name,
      amount: amt,
      date: new Date(),
      method: paymentMethod === 'cash' ? 'نقدي (كاش)' : 'تحويل بنكي / محفظة',
      collector: currentUser.name,
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Users className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">
              دليل العملاء وحسابات الآجل وسندات القبض
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              متابعة حسابات ديون العملاء، حدود الائتمان، وتحصيل النقدية وإصدار سندات القبض
            </p>
          </div>
        </div>

        {/* Total Debt summary */}
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 px-4 py-2.5 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <span className="text-[11px] text-red-700 font-bold block">إجمالي ديون العملاء بالسوق</span>
            <span className="text-lg font-black text-red-800 font-mono">
              {totalOutstandingDebt.toFixed(2)} ج.م
            </span>
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Customers Cards & Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => {
          const debt = customer.outstandingBalance || 0;
          const limit = 1000;
          const usagePercent = Math.min(100, Math.round((debt / limit) * 100));

          return (
            <div
              key={customer.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{customer.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{customer.phone}</span>
                    </div>
                  </div>
                </div>

                {customer.address && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}

                {/* Debt status */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">الرصيد المدين المستحق:</span>
                    <span
                      className={`font-mono font-black text-sm ${
                        debt > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {debt.toFixed(2)} ج.م
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>الحد الائتماني التقديري:</span>
                    <span className="font-mono">{limit.toFixed(2)} ج.م</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => handleOpenCollect(customer)}
                  disabled={debt <= 0}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>تحصيل نقدية (سند قبض)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Collect Debt */}
      {showCollectModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">سند تحصيل نقدية من عميل</h3>
                <p className="text-xs text-slate-500">العميل: <strong className="text-slate-800">{selectedCustomer.name}</strong></p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <span className="text-slate-600">المديونية الحالية:</span>
              <span className="font-mono font-black text-red-600 text-base">
                {(selectedCustomer.outstandingBalance || 0).toFixed(2)} ج.م
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المحصل (ج.م)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="w-full text-2xl font-black font-mono text-center p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">طريقة السداد</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2 text-xs font-bold rounded-xl border border-slate-300 outline-none"
                >
                  <option value="cash">نقدياً (يُضاف لدرج وردية الكاشير مباشرة)</option>
                  <option value="bank_card">بطاقة / فيزا</option>
                  <option value="bank_transfer">تحويل بنكي / محفظة إلكترونية</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البيان / ملاحظات السند</label>
                <input
                  type="text"
                  value={collectNote}
                  onChange={(e) => setCollectNote(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={() => setShowCollectModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmCollect}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
              >
                تأكيد التحصيل وطباعة السند
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Printable Receipt Voucher */}
      {printedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h4 className="font-black text-slate-900 text-base">{activeBranch.nameAr}</h4>
              <p className="text-xs text-slate-500 font-bold">سند قبض نقدية رسمي</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                تاريخ: {printedVoucher.date.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-700 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span>استلمنا من السيد/ة:</span>
                <span className="font-bold">{printedVoucher.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>مبلغاً وقدره:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {printedVoucher.amount.toFixed(2)} ج.م
                </span>
              </div>
              <div className="flex justify-between">
                <span>طريقة الدفع:</span>
                <span className="font-bold">{printedVoucher.method}</span>
              </div>
              <div className="flex justify-between">
                <span>المستلم (المحصل):</span>
                <span className="font-bold">{printedVoucher.collector}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setPrintedVoucher(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                تم الإغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة حرارية</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
