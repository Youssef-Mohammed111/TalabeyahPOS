import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { GoodsReceiptItem } from '../../types/index.ts';
import { formatMoney, roundMoney } from '../../utils/accounting.ts';
import {
  ArrowDownLeft,
  Plus,
  Truck,
  CheckCircle2,
  FileText,
  User,
  Calendar,
  DollarSign,
  X,
  History,
  RotateCcw,
} from 'lucide-react';

export const PurchasingScreen: React.FC = () => {
  const {
    lang,
    t,
    suppliers,
    products,
    goodsReceipts,
    receiveGoods,
    createSupplierReturn,
    cashboxes,
  } = useStore();

  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [receiveItems, setReceiveItems] = useState<
    { productId: string; orderedQty: number; receivedQty: number; unitCost: number }[]
  >([]);
  const [amountPaidAtReceiving, setAmountPaidAtReceiving] = useState('0');
  const [payMethod, setPayMethod] = useState<'cash' | 'credit'>('cash');

  // Supplier Return Modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnSupplierId, setReturnSupplierId] = useState(suppliers[0]?.id || '');
  const [returnProductId, setReturnProductId] = useState(products[0]?.id || '');
  const [returnQty, setReturnQty] = useState('5');
  const [returnReason, setReturnReason] = useState('بضاعة تالفة أو غير مطابقة للمواصفات');

  const handleOpenReceive = () => {
    if (products.length > 0) {
      setReceiveItems([
        {
          productId: products[0].id,
          orderedQty: 50,
          receivedQty: 50,
          unitCost: products[0].purchaseCost || 18,
        },
      ]);
      setSupplierInvoiceNo(`SUP-INV-${Date.now().toString().slice(-5)}`);
      setReceiveModalOpen(true);
    }
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || receiveItems.length === 0) return;

    const totalCost = receiveItems.reduce((sum, it) => sum + roundMoney(it.receivedQty * it.unitCost), 0);
    const paid = payMethod === 'cash' ? parseFloat(amountPaidAtReceiving) || 0 : 0;
    const remaining = Math.max(0, roundMoney(totalCost - paid));

    const items: GoodsReceiptItem[] = receiveItems.map((it) => ({
      productId: it.productId,
      orderedQty: it.orderedQty,
      receivedQty: it.receivedQty,
      unitCost: it.unitCost,
      totalCost: roundMoney(it.receivedQty * it.unitCost),
    }));

    receiveGoods({
      supplierId: selectedSupplierId,
      supplierInvoiceNumber: supplierInvoiceNo,
      purchaseDate: new Date().toISOString().slice(0, 10),
      items,
      totalCost,
      paidAmount: paid,
      paymentMethod: payMethod === 'cash' ? 'cash' : undefined,
      remainingPayable: remaining,
      receivedBy: 'أمين المخزن',
      status: 'POSTED',
    });

    setReceiveModalOpen(false);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === returnProductId);
    const qty = parseFloat(returnQty) || 1;
    if (!prod || qty <= 0) return;

    createSupplierReturn({
      supplierId: returnSupplierId,
      items: [
        {
          productId: prod.id,
          quantity: qty,
          unitCost: prod.purchaseCost,
          totalAmount: roundMoney(qty * prod.purchaseCost),
          reason: returnReason,
        },
      ],
      totalAmount: roundMoney(qty * prod.purchaseCost),
      settlementType: 'PAYABLE_REDUCTION',
      approvedBy: 'مدير الفرع',
    });

    setReturnModalOpen(false);
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            <span>{t.inventory.receiveGoods} (Purchasing & Inward Stock)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'ar'
              ? 'تسجيل فواتير وتوريدات الموردين، احتساب متوسط التكلفة المتحرك وتحديث أرصدة الموردين'
              : 'Supplier receiving, moving weighted-average cost recalculation and payables'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setReturnModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>{t.inventory.supplierReturn}</span>
          </button>

          <button
            onClick={handleOpenReceive}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'استلام شحنة جديدة (F3)' : 'New Goods Receipt'}</span>
          </button>
        </div>
      </div>

      {/* Suppliers Balances Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {suppliers.map((sup) => (
          <div key={sup.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">مورد معتمد</span>
                <h3 className="font-bold text-sm text-slate-900 mt-0.5">{sup.name}</h3>
                <div className="text-xs text-slate-500 mt-1">{sup.phone} • {sup.address}</div>
              </div>
              <div className="text-end">
                <span className="text-[10px] text-slate-400 font-semibold block">المستحق له (آجل)</span>
                <span className="text-base font-extrabold text-red-600">
                  {formatMoney(sup.payableBalance, lang)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Receipts History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
          <span>سجل الشحنات وفواتير التوريد السابقة</span>
          <span className="text-xs text-slate-500 font-medium">عدد العمليات: {goodsReceipts.length}</span>
        </div>

        {goodsReceipts.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            <Truck className="w-10 h-10 stroke-1 text-slate-300 mx-auto mb-2" />
            <p>لا توجد فواتير استلام مسجلة بعد. اضغط "استلام شحنة جديدة" للبدء.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">رقم الإذن</th>
                  <th className="p-3 text-start">فاتورة المورد</th>
                  <th className="p-3 text-start">المورد</th>
                  <th className="p-3 text-start">الأصناف المستلمة</th>
                  <th className="p-3 text-start">إجمالي التكلفة</th>
                  <th className="p-3 text-start">المسدد نقداً</th>
                  <th className="p-3 text-start">المتبقي آجل</th>
                  <th className="p-3 text-start">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {goodsReceipts.map((rcv) => {
                  const sup = suppliers.find((s) => s.id === rcv.supplierId);
                  return (
                    <tr key={rcv.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono font-bold text-slate-800">{rcv.receiptNumber}</td>
                      <td className="p-3 font-mono text-slate-600">{rcv.supplierInvoiceNumber}</td>
                      <td className="p-3 font-bold text-slate-900">{sup ? sup.name : '—'}</td>
                      <td className="p-3 text-slate-600">
                        {rcv.items.length} أصناف
                      </td>
                      <td className="p-3 font-extrabold text-slate-900">{formatMoney(rcv.totalCost, lang)}</td>
                      <td className="p-3 font-bold text-emerald-700">{formatMoney(rcv.paidAmount, lang)}</td>
                      <td className="p-3 font-bold text-red-600">{formatMoney(rcv.remainingPayable, lang)}</td>
                      <td className="p-3 text-slate-500">{rcv.purchaseDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Receive Goods */}
      {receiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                <span>{lang === 'ar' ? 'إذن استلام بضائع وتحديث التكلفة (Scenario B)' : 'Goods Receiving'}</span>
              </h3>
              <button
                onClick={() => setReceiveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit} className="py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المورد</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم فاتورة المورد</label>
                  <input
                    type="text"
                    required
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">الأصناف الموردة وأسعار الشراء</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (products.length > 0) {
                        setReceiveItems((prev) => [
                          ...prev,
                          {
                            productId: products[0].id,
                            orderedQty: 20,
                            receivedQty: 20,
                            unitCost: products[0].purchaseCost || 15,
                          },
                        ]);
                      }
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    + إضافة صنف
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {receiveItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const updated = [...receiveItems];
                            updated[idx].productId = e.target.value;
                            const prod = products.find((p) => p.id === e.target.value);
                            if (prod) updated[idx].unitCost = prod.purchaseCost;
                            setReceiveItems(updated);
                          }}
                          className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nameAr} ({p.baseUnit})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => setReceiveItems(receiveItems.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block">الكمية المطلوبة</label>
                          <input
                            type="number"
                            value={item.orderedQty}
                            onChange={(e) => {
                              const updated = [...receiveItems];
                              updated[idx].orderedQty = parseFloat(e.target.value) || 0;
                              setReceiveItems(updated);
                            }}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-center font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">الكمية المستلمة فعلياً</label>
                          <input
                            type="number"
                            value={item.receivedQty}
                            onChange={(e) => {
                              const updated = [...receiveItems];
                              updated[idx].receivedQty = parseFloat(e.target.value) || 0;
                              setReceiveItems(updated);
                            }}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-center font-extrabold text-emerald-700"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">سعر الشراء / الوحدة</label>
                          <input
                            type="number"
                            step="0.5"
                            value={item.unitCost}
                            onChange={(e) => {
                              const updated = [...receiveItems];
                              updated[idx].unitCost = parseFloat(e.target.value) || 0;
                              setReceiveItems(updated);
                            }}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">إجمالي قيمة التوريد:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatMoney(
                      receiveItems.reduce((s, it) => s + roundMoney(it.receivedQty * it.unitCost), 0),
                      lang
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">طريقة السداد</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    >
                      <option value="cash">سداد نقدي من الدرج</option>
                      <option value="credit">حساب آجل (قيد على المورد)</option>
                    </select>
                  </div>

                  {payMethod === 'cash' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المسدد نقداً</label>
                      <input
                        type="number"
                        value={amountPaidAtReceiving}
                        onChange={(e) => setAmountPaidAtReceiving(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                {lang === 'ar' ? 'تأكيد التوريد وتحديث المخزون والتكلفة' : 'Post Receiving & Update Cost'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Supplier Return */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <span>{t.inventory.supplierReturn}</span>
              </h3>
              <button
                onClick={() => setReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المورد</label>
                <select
                  value={returnSupplierId}
                  onChange={(e) => setReturnSupplierId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المنتج المرتجع</label>
                <select
                  value={returnProductId}
                  onChange={(e) => setReturnProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr} (تكلفة: {formatMoney(p.purchaseCost, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الكمية المرتجعة</label>
                <input
                  type="number"
                  required
                  value={returnQty}
                  onChange={(e) => setReturnQty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب الإرجاع</label>
                <input
                  type="text"
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
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
