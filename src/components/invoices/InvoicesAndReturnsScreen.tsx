import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { SaleInvoice, CustomerReturn, PaymentMethod } from '../../types/index.ts';
import {
  Search,
  Receipt,
  RotateCcw,
  Printer,
  Calendar,
  User,
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Filter,
  FileText,
} from 'lucide-react';
import { ManagerPinModal } from '../common/ManagerPinModal.tsx';

export const InvoicesAndReturnsScreen: React.FC = () => {
  const {
    salesInvoices,
    customerReturns,
    activeBranch,
    currentUser,
    createCustomerReturn,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'RETURNS'>('INVOICES');

  // Selected invoice for detail view or return
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Return form state
  const [returnItems, setReturnItems] = useState<{
    productId: string;
    productName: string;
    unitPrice: number;
    maxQty: number;
    qtyToReturn: number;
    condition: 'SALEABLE' | 'DAMAGED';
  }[]>([]);
  const [returnReason, setReturnReason] = useState('ذبول أو تلف في الصنف');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('cash');

  // Manager PIN modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState<(() => void) | null>(null);
  const [pinTitle, setPinTitle] = useState('');

  const requireManagerAuth = (action: () => void, title: string) => {
    if (currentUser.role === 'owner' || currentUser.role === 'manager' || currentUser.role === 'super_admin') {
      action();
    } else {
      setPinTitle(title);
      setPinAction(() => action);
      setShowPinModal(true);
    }
  };

  // Filter invoices
  const filteredSales = salesInvoices.filter((sale) => {
    const matchesSearch =
      sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      sale.cashierName.toLowerCase().includes(searchTerm.toLowerCase());

    const hasPayment = (m: PaymentMethod) => sale.payments.some((p) => p.method === m);
    const matchesType =
      filterType === 'ALL' ||
      (filterType === 'CASH' && hasPayment('cash')) ||
      (filterType === 'CARD' && hasPayment('bank_card')) ||
      (filterType === 'CREDIT' && (hasPayment('customer_credit') || sale.remainingCredit > 0));

    return matchesSearch && matchesType;
  });

  const handleOpenReturnModal = (sale: SaleInvoice) => {
    setSelectedInvoice(sale);
    setReturnItems(
      sale.items.map((item) => ({
        productId: item.productId,
        productName: item.productNameAr,
        unitPrice: item.unitPrice,
        maxQty: item.quantity,
        qtyToReturn: 0,
        condition: 'SALEABLE',
      }))
    );
    setShowReturnModal(true);
  };

  const handleExecuteReturn = () => {
    if (!selectedInvoice) return;
    const itemsToReturn = returnItems.filter((i) => i.qtyToReturn > 0);

    if (itemsToReturn.length === 0) {
      alert('يرجى تحديد كمية صنف واحد على الأقل للمرتجع');
      return;
    }

    const totalRefund = itemsToReturn.reduce((sum, item) => sum + item.qtyToReturn * item.unitPrice, 0);

    const proceed = () => {
      createCustomerReturn({
        originalInvoiceId: selectedInvoice.id,
        originalInvoiceNumber: selectedInvoice.invoiceNumber,
        customerId: selectedInvoice.customerId,
        items: itemsToReturn.map((item) => ({
          productId: item.productId,
          quantity: item.qtyToReturn,
          originalUnitPrice: item.unitPrice,
          refundUnitPrice: item.unitPrice,
          totalRefund: item.qtyToReturn * item.unitPrice,
          condition: item.condition,
        })),
        totalRefundAmount: totalRefund,
        refundPaymentMethod: refundMethod,
        reason: returnReason,
        approvedBy: currentUser.name,
        status: 'POSTED',
      });
      setShowReturnModal(false);
      setSelectedInvoice(null);
      setActiveTab('RETURNS');
    };

    // If cash refund from drawer, require manager PIN
    if (refundMethod === 'cash') {
      requireManagerAuth(proceed, `اعتماد مرتجع نقدية من الدرج بمبلغ (${totalRefund.toFixed(2)} ج.م)`);
    } else {
      proceed();
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Receipt className="w-6 h-6 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">
              سجل الفواتير والمرتجعات
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              استعراض المبيعات السابقة، إعادة طباعة الإيصالات، وتسجيل مرتجعات العملاء المعتمدة
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'INVOICES'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>سجل فواتير البيع ({salesInvoices.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('RETURNS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'RETURNS'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>سجل المرتجعات ({customerReturns.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'INVOICES' ? (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث برقم الفاتورة، اسم العميل، أو الكاشير..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none"
              >
                <option value="ALL">جميع طرق الدفع</option>
                <option value="CASH">نقدي (كاش)</option>
                <option value="CARD">بطاقة / فيزا</option>
                <option value="CREDIT">آجل على الحساب</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">رقم الفاتورة</th>
                    <th className="p-3.5">الوقت والتاريخ</th>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5">الكاشير</th>
                    <th className="p-3.5">طريقة الدفع</th>
                    <th className="p-3.5">عدد الأصناف</th>
                    <th className="p-3.5">الإجمالي</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لا توجد فواتير مطابقة لخيارات البحث
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-mono font-bold text-indigo-700">
                          {sale.invoiceNumber}
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {new Date(sale.timestamp).toLocaleString('ar-EG', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="p-3.5 font-medium text-slate-800">
                          {sale.customerName || 'عميل نقدي سريع'}
                        </td>
                        <td className="p-3.5 text-slate-600">{sale.cashierName}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                            {sale.payments.map((p) => (p.method === 'cash' ? 'كاش' : p.method === 'bank_card' ? 'فيزا' : 'آجل')).join(' + ') || 'نقدي'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono">{sale.items.length} صنف</td>
                        <td className="p-3.5 font-mono font-black text-slate-900 text-sm">
                          {sale.total.toFixed(2)} ج.م
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedInvoice(sale);
                                setShowDetailModal(true);
                              }}
                              className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition"
                              title="عرض الفاتورة والطباعة"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenReturnModal(sale)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold flex items-center gap-1 transition"
                              title="عمل مرتجع"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>مرتجع</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Returns Log Tab */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">رقم المرتجع</th>
                  <th className="p-3.5">تاريخ الإرجاع</th>
                  <th className="p-3.5">الفاتورة الأصلية</th>
                  <th className="p-3.5">الأصناف المرجعة</th>
                  <th className="p-3.5">قيمة المرتجع</th>
                  <th className="p-3.5">طريقة الرد</th>
                  <th className="p-3.5">السبب</th>
                  <th className="p-3.5">المعتمد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerReturns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لا توجد أي مرتجعات مسجلة حتى الآن
                    </td>
                  </tr>
                ) : (
                  customerReturns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-amber-700">
                        {ret.returnNumber}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(ret.timestamp).toLocaleString('ar-EG', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="p-3.5 font-mono text-indigo-700 font-bold">
                        {ret.originalInvoiceNumber}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          {ret.items.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="font-mono text-slate-700">صنف ({it.productId})</span>
                              <span className="font-mono text-slate-500">({it.quantity} وحدة)</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  it.condition === 'SALEABLE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {it.condition === 'SALEABLE' ? 'صالح للمخزن' : 'هالك/تالف'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-black text-red-600 text-sm">
                        -{ret.totalRefundAmount.toFixed(2)} ج.م
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                          {ret.refundPaymentMethod === 'cash' ? 'رد نقدية من الدرج' : 'خصم من رصيد العميل'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">{ret.reason}</td>
                      <td className="p-3.5 text-slate-600">{ret.approvedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Invoice Details & Thermal Reprint */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h3 className="font-black text-slate-900 text-lg">{activeBranch.nameAr}</h3>
              <p className="text-xs text-slate-500">محل خضار وفاكهة طازجة</p>
              <p className="text-xs font-mono font-bold text-indigo-700 mt-1">
                فاتورة رقم: {selectedInvoice.invoiceNumber}
              </p>
            </div>

            <div className="text-xs space-y-1 text-slate-600 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span>التاريخ والوقت:</span>
                <span className="font-mono">
                  {new Date(selectedInvoice.timestamp).toLocaleString('ar-EG', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>الكاشير:</span>
                <span className="font-bold">{selectedInvoice.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>العميل:</span>
                <span className="font-bold">{selectedInvoice.customerName || 'عميل نقدي'}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedInvoice.items.map((item, idx: number) => (
                <div key={idx} className="flex justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{item.productNameAr}</span>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      {item.quantity} × {item.unitPrice.toFixed(2)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    {item.total.toFixed(2)} ج.م
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-3 border-t border-dashed border-slate-300 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>المجموع الفرعي:</span>
                <span className="font-mono">{selectedInvoice.subtotal.toFixed(2)} ج.م</span>
              </div>
              {selectedInvoice.discount > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>الخصم الممنوح:</span>
                  <span className="font-mono">-{selectedInvoice.discount.toFixed(2)} ج.م</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t">
                <span>الإجمالي النهائي:</span>
                <span className="font-mono text-indigo-700">{selectedInvoice.total.toFixed(2)} ج.م</span>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>إعادة طباعة حرارية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Customer Return Process */}
      {showReturnModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">تسجيل مرتجع أصناف من الفاتورة</h3>
                <p className="text-xs text-slate-500">
                  الفاتورة: <strong className="font-mono text-indigo-700">{selectedInvoice.invoiceNumber}</strong> — حدد الكميات وحالة البضاعة المرتجعة
                </p>
              </div>
            </div>

            {/* Items Selection */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {returnItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 text-sm block">{item.productName}</span>
                    <span className="text-slate-500 font-mono">
                      سعر البيع: {item.unitPrice.toFixed(2)} ج.م — الكمية المباعة: {item.maxQty}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">كمية الإرجاع</label>
                      <input
                        type="number"
                        min="0"
                        max={item.maxQty}
                        step="0.05"
                        value={item.qtyToReturn || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setReturnItems((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, qtyToReturn: Math.min(val, it.maxQty) } : it))
                          );
                        }}
                        className="w-20 p-1.5 font-bold font-mono text-center rounded-lg border border-slate-300 bg-white"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">حالة البضاعة</label>
                      <select
                        value={item.condition}
                        onChange={(e) => {
                          const cond = e.target.value as 'SALEABLE' | 'DAMAGED';
                          setReturnItems((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, condition: cond } : it))
                          );
                        }}
                        className="p-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="SALEABLE">صالح للبيع (يُعاد للمخزن)</option>
                        <option value="DAMAGED">هالك / تالف (يسجل خسارة)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Refund Total and Method */}
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
              <div>
                <span className="text-slate-600 block">إجمالي المبلغ المسترد للعميل:</span>
                <span className="text-xl font-black font-mono text-indigo-900">
                  {returnItems
                    .reduce((sum, item) => sum + item.qtyToReturn * item.unitPrice, 0)
                    .toFixed(2)}{' '}
                  ج.م
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">طريقة الرد:</span>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
                  className="p-2 rounded-xl border border-indigo-300 bg-white font-bold text-xs outline-none"
                >
                  <option value="cash">رد نقدية من الدرج (كاش)</option>
                  <option value="customer_credit">خصم من رصيد آجل العميل</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">سبب المرتجع</label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-300 outline-none"
                placeholder="توضيح سبب المرتجع..."
              />
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={() => setShowReturnModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleExecuteReturn}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md"
              >
                تأكيد المرتجع (مع اعتماد المشرف)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager PIN Modal */}
      <ManagerPinModal
        isOpen={showPinModal}
        title={pinTitle}
        description="يتطلب اعتماد رد النقدية من الدرج موافقة المدير بالرقم السري"
        actionLabel="اعتماد ومتابعة"
        onSuccess={() => {
          setShowPinModal(false);
          if (pinAction) pinAction();
        }}
        onClose={() => {
          setShowPinModal(false);
          setPinAction(null);
        }}
      />
    </div>
  );
};
