import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { WasteRecord, StockAuditSession, StockAuditItem } from '../../types/index.ts';
import { calculateAvailableStock } from '../../utils/inventory.ts';
import {
  Trash2,
  ClipboardCheck,
  AlertTriangle,
  Plus,
  Calendar,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  Package,
  Layers,
} from 'lucide-react';

export const WasteAndAuditScreen: React.FC = () => {
  const {
    products,
    stocks,
    wasteRecords,
    stockAuditSessions,
    activeBranch,
    currentUser,
    recordWaste,
    createStockAudit,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'WASTE' | 'AUDIT'>('WASTE');

  // Waste logging form state
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState<WasteRecord['reason']>('rotten');
  const [wasteNote, setWasteNote] = useState('');

  // Stock audit session state
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditNotes, setAuditNotes] = useState('جرد نهاية الأسبوع الدوري');
  const [auditCounts, setAuditCounts] = useState<Record<string, number>>({});

  // Calculate total waste cost
  const totalWasteLoss = wasteRecords.reduce((sum, r) => sum + r.totalCost, 0);

  const handleSaveWaste = () => {
    const qty = parseFloat(wasteQty);
    if (!selectedProductId || !qty || qty <= 0) return;
    recordWaste(selectedProductId, qty, wasteReason, wasteNote || 'تسجيل هالك');
    setShowWasteModal(false);
    setWasteQty('');
    setWasteNote('');
  };

  const handleStartAuditModal = () => {
    const initCounts: Record<string, number> = {};
    products.forEach((p) => {
      const stock = stocks.find((s) => s.productId === p.id && s.branchId === activeBranch.id);
      initCounts[p.id] = stock ? stock.physicalQty : 0;
    });
    setAuditCounts(initCounts);
    setShowAuditModal(true);
  };

  const handleCommitAudit = () => {
    const items: StockAuditItem[] = products.map((p) => {
      const stock = stocks.find((s) => s.productId === p.id && s.branchId === activeBranch.id);
      const systemQty = stock ? stock.physicalQty : 0;
      const countedQty = auditCounts[p.id] !== undefined ? auditCounts[p.id] : systemQty;
      const varianceQty = countedQty - systemQty;
      const unitCost = p.purchaseCost || 0;
      const varianceCost = varianceQty * unitCost;

      return {
        productId: p.id,
        systemQty,
        countedQty,
        varianceQty,
        varianceCost,
        notes: auditNotes,
      };
    });

    createStockAudit(items);
    setShowAuditModal(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">
              إدارة الهالك والجرد الدوري للبضاعة
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              تسجيل الخسائر الناتجة عن تلف وذبول الخضار والفاكهة، وإجراء جلسات مطابقة المخزون الفعلي مع الدفتري
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('WASTE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'WASTE'
                ? 'bg-white text-red-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>سجل الهالك والتالف ({wasteRecords.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'AUDIT'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>جلسات الجرد والمطابقة ({stockAuditSessions.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'WASTE' ? (
        <>
          {/* Waste Stats & Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">إجمالي الخسارة المالية للهالك</span>
              <div className="text-2xl font-black text-red-600 font-mono">
                {totalWasteLoss.toFixed(2)} ج.م
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">تؤثر مباشرة على صافي الأرباح</span>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">عدد عمليات الإتلاف والفرز</span>
              <div className="text-2xl font-black text-slate-800 font-mono">
                {wasteRecords.length} عملية
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">مسجلة في سجل الهالك</span>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
              <button
                onClick={() => setShowWasteModal(true)}
                className="w-full h-full py-3 px-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Plus className="w-5 h-5" />
                <span>تسجيل هالك جديد (ذبول/تلف/فرز)</span>
              </button>
            </div>
          </div>

          {/* Waste Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-sm">سجل الهالك والتالف المفصل</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">التاريخ والوقت</th>
                    <th className="p-3.5">الصنف</th>
                    <th className="p-3.5">الكمية التالفة</th>
                    <th className="p-3.5">تكلفة الوحدة</th>
                    <th className="p-3.5">إجمالي الخسارة</th>
                    <th className="p-3.5">سبب التلف</th>
                    <th className="p-3.5">المسؤول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wasteRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        لا توجد أي سجلات هالك حتى الآن
                      </td>
                    </tr>
                  ) : (
                    wasteRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 text-slate-500 font-mono">
                          {new Date(rec.timestamp).toLocaleString('ar-EG', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800 text-sm">
                          {rec.productName}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-700">
                          {rec.quantity} {rec.unit === 'kg' ? 'كجم' : 'قطعة'}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">
                          {rec.unitCost.toFixed(2)} ج.م
                        </td>
                        <td className="p-3.5 font-mono font-black text-red-600 text-sm">
                          -{rec.totalCost.toFixed(2)} ج.م
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-800 font-bold text-[11px]">
                            {rec.reason === 'rotten'
                              ? 'عفن وتلف طبيعي'
                              : rec.reason === 'crushed'
                              ? 'سحق وكسر'
                              : rec.reason === 'expired'
                              ? 'منتهي الصلاحية'
                              : rec.reason === 'damaged'
                              ? 'تلف وسوء تخزين'
                              : 'أخرى'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600">{rec.recordedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Stock Audit Sessions Tab */
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div>
              <h2 className="font-bold text-slate-800 text-base">جلسات الجرد الدوري والمطابقة</h2>
              <p className="text-xs text-slate-500">
                تسجيل العد الفعلي للأصناف في المحل والمخزن ومقارنته بالرصيد المسجل آلياً
              </p>
            </div>
            <button
              onClick={handleStartAuditModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>بدء جلسة جرد جديدة</span>
            </button>
          </div>

          <div className="space-y-4">
            {stockAuditSessions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
                لا توجد أي جلسات جرد سابقة. انقر على «بدء جلسة جرد جديدة» للبدء.
              </div>
            ) : (
              stockAuditSessions.map((session) => {
                const totalVarianceCost = session.items.reduce((sum, item) => sum + item.varianceCost, 0);

                return (
                  <div
                    key={session.id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                  >
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 text-sm">
                          {session.auditNumber}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({new Date(session.createdAt).toLocaleString('ar-EG', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })})
                        </span>
                        <span className="text-xs text-slate-600 font-bold">بواسطة: {session.auditedBy}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span>إجمالي العجز/الزيادة:</span>
                        <span
                          className={`font-black text-sm px-2 py-0.5 rounded ${
                            totalVarianceCost < 0
                              ? 'text-red-700 bg-red-100'
                              : totalVarianceCost > 0
                              ? 'text-emerald-700 bg-emerald-100'
                              : 'text-slate-700 bg-slate-200'
                          }`}
                        >
                          {totalVarianceCost.toFixed(2)} ج.م
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="p-3">الصنف</th>
                            <th className="p-3">الرصيد الدفتري</th>
                            <th className="p-3">العد الفعلي</th>
                            <th className="p-3">الفارق بالكمية</th>
                            <th className="p-3">قيمة الفارق المالي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {session.items.map((item, idx) => {
                            const prod = products.find((p) => p.id === item.productId);
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold text-slate-800">
                                  {prod?.nameAr || item.productId}
                                </td>
                                <td className="p-3 font-mono text-slate-600">{item.systemQty.toFixed(2)}</td>
                                <td className="p-3 font-mono font-bold text-slate-800">{item.countedQty.toFixed(2)}</td>
                                <td className="p-3 font-mono">
                                  {item.varianceQty === 0 ? (
                                    <span className="text-slate-400">0.00</span>
                                  ) : item.varianceQty > 0 ? (
                                    <span className="text-emerald-600 font-bold">+{item.varianceQty.toFixed(2)}</span>
                                  ) : (
                                    <span className="text-red-600 font-bold">{item.varianceQty.toFixed(2)}</span>
                                  )}
                                </td>
                                <td className="p-3 font-mono font-black">
                                  {item.varianceCost === 0 ? (
                                    <span className="text-slate-400">0.00 ج.م</span>
                                  ) : item.varianceCost > 0 ? (
                                    <span className="text-emerald-600">+{item.varianceCost.toFixed(2)} ج.م</span>
                                  ) : (
                                    <span className="text-red-600">{item.varianceCost.toFixed(2)} ج.م</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: Record Waste */}
      {showWasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">تسجيل هالك وتالف في الخضار/الفاكهة</h3>
                <p className="text-xs text-slate-500">خصم الكمية التالفة من المخزون واحتساب الخسارة المالية</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر الصنف التالف</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-300 outline-none"
                >
                  {products.map((p) => {
                    const stock = stocks.find((s) => s.productId === p.id && s.branchId === activeBranch.id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.nameAr} (المتاح: {stock ? calculateAvailableStock(stock) : 0} {p.baseUnit === 'kg' ? 'كجم' : 'قطعة'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الكمية التالفة (بالوزن أو القطعة)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  value={wasteQty}
                  onChange={(e) => setWasteQty(e.target.value)}
                  className="w-full text-xl font-black font-mono text-center p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب التلف</label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value as WasteRecord['reason'])}
                  className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-300 outline-none"
                >
                  <option value="rotten">عفن وتلف طبيعي</option>
                  <option value="crushed">سحق وكسر أثناء النقل أو التداول</option>
                  <option value="damaged">تلف وسوء تخزين وتبريد</option>
                  <option value="expired">منتهي الصلاحية</option>
                  <option value="other">أخرى (فرز وتنظيف)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
                <input
                  type="text"
                  value={wasteNote}
                  onChange={(e) => setWasteNote(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 outline-none"
                  placeholder="مثال: ذبول أثناء نقل الصباح..."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={() => setShowWasteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveWaste}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                تسجيل الهالك وخصم المخزون
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Stock Audit Session Entry */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">إجراء جلسة جرد فعلي للمحل</h3>
                <p className="text-xs text-slate-500">سجل الكمية الفعلية الموجودة على الأرفف وثلاجة المحل</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان أو سبب الجرد</label>
              <input
                type="text"
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {products.map((p) => {
                const stock = stocks.find((s) => s.productId === p.id && s.branchId === activeBranch.id);
                const sysQty = stock ? stock.physicalQty : 0;
                const counted = auditCounts[p.id] !== undefined ? auditCounts[p.id] : sysQty;
                const diff = counted - sysQty;

                return (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block text-sm">{p.nameAr}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        الدفتري: {sysQty.toFixed(2)} {p.baseUnit === 'kg' ? 'كجم' : 'قطعة'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <input
                          type="number"
                          step="0.1"
                          value={counted}
                          onChange={(e) =>
                            setAuditCounts((prev) => ({
                              ...prev,
                              [p.id]: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-full p-1.5 text-center font-mono font-bold rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <span
                        className={`w-20 text-center font-mono font-bold ${
                          diff === 0 ? 'text-slate-400' : diff > 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {diff === 0 ? 'مطابق' : diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={() => setShowAuditModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleCommitAudit}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
              >
                اعتماد نتائج الجرد وترحيل الفروقات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
