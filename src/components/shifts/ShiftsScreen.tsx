import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import {
  Clock,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ShieldCheck,
  Receipt,
  User,
  History,
  Lock,
} from 'lucide-react';
import { ManagerPinModal } from '../common/ManagerPinModal.tsx';

export const ShiftsScreen: React.FC = () => {
  const {
    activeShift,
    cashierShifts,
    currentUser,
    activeBranch,
    openShift,
    closeShift,
    recordDrawerWithdrawal,
    recordDrawerDeposit,
  } = useStore();

  // Modals state
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState('200');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualCashInput, setActualCashInput] = useState('');
  const [varianceNoteInput, setVarianceNoteInput] = useState('');

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('توريد للخزينة الرئيسية');

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositReason, setDepositReason] = useState('تغذية فكة إضافية');

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState<(() => void) | null>(null);
  const [pinTitle, setPinTitle] = useState('');

  const [selectedShiftForPrint, setSelectedShiftForPrint] = useState<string | null>(null);

  // Trigger PIN modal helper
  const requireManagerAuth = (action: () => void, title: string) => {
    // If current user is already owner/manager, still verify PIN or allow immediate
    if (currentUser.role === 'owner' || currentUser.role === 'manager' || currentUser.role === 'super_admin') {
      action();
    } else {
      setPinTitle(title);
      setPinAction(() => action);
      setShowPinModal(true);
    }
  };

  const handleOpenShift = () => {
    const val = parseFloat(openingCashInput) || 0;
    openShift(val);
    setShowOpenModal(false);
  };

  const handleConfirmWithdrawal = () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) return;
    requireManagerAuth(() => {
      recordDrawerWithdrawal(amt, withdrawReason, currentUser.name);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
    }, `اعتماد سحب نقدية من الدرج (${amt.toFixed(2)} ج.م)`);
  };

  const handleConfirmDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;
    recordDrawerDeposit(amt, depositReason);
    setShowDepositModal(false);
    setDepositAmount('');
  };

  const handleConfirmCloseShift = () => {
    const actual = parseFloat(actualCashInput) || 0;
    closeShift(actual, varianceNoteInput);
    setShowCloseModal(false);
    setActualCashInput('');
    setVarianceNoteInput('');
  };

  // Printable Shift Report
  const shiftToPrint = cashierShifts.find((s) => s.id === selectedShiftForPrint);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800">
                الورديات ومراقبة الدرج النقدي
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                تسجيل فتح وإغلاق ورديات الكاشير، فوارق العجز والزيادة، وسحوبات الدرج المعتمدة
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeShift ? (
            <button
              onClick={() => {
                setActualCashInput(activeShift.expectedCash.toFixed(2));
                setShowCloseModal(true);
              }}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition"
            >
              <Lock className="w-4 h-4" />
              <span>تقفيل وتسليم الوردية الحالية</span>
            </button>
          ) : (
            <button
              onClick={() => setShowOpenModal(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition"
            >
              <Clock className="w-4 h-4" />
              <span>فتح وردية جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Shift Overview */}
      {activeShift ? (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-700/80 gap-4">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  وردية نشطة ومفتوحة حالياً
                </span>
                <span className="text-slate-400 text-sm">
                  رقم الوردية: <span className="text-white font-mono font-bold">#{activeShift.id.slice(-6)}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>الكاشير: <strong className="text-white">{activeShift.cashierName}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>بدأت: <strong className="text-white font-mono">{new Date(activeShift.openedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                </div>
              </div>
            </div>

            {/* Key KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 my-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <span className="text-xs text-slate-400 block mb-1">رصيد الافتتاح (فكة)</span>
                <span className="text-xl font-black text-white font-mono">
                  {activeShift.openingCash.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">ج.م</span>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
                <span className="text-xs text-emerald-300 block mb-1">مبيعات نقدية (درج)</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  +{activeShift.cashSales.toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-400/80 block mt-0.5">ج.م كاش</span>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                <span className="text-xs text-blue-300 block mb-1">تحصيل ديون كاش</span>
                <span className="text-xl font-black text-blue-400 font-mono">
                  +{activeShift.collections.toFixed(2)}
                </span>
                <span className="text-[10px] text-blue-400/80 block mt-0.5">ج.م مقبوضات</span>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                <span className="text-xs text-amber-300 block mb-1">مرتجعات من الدرج</span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  -{activeShift.refunds.toFixed(2)}
                </span>
                <span className="text-[10px] text-amber-400/80 block mt-0.5">ج.م رد نقدية</span>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4">
                <span className="text-xs text-purple-300 block mb-1">سحوبات ومصاريف</span>
                <span className="text-xl font-black text-purple-400 font-mono">
                  -{activeShift.cashDrops.toFixed(2)}
                </span>
                <span className="text-[10px] text-purple-400/80 block mt-0.5">ج.م توريد للخزينة</span>
              </div>

              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-lg border border-emerald-400/40">
                <span className="text-xs text-emerald-100 block mb-1">الرصيد المتوقع بالدرج</span>
                <span className="text-2xl font-black text-white font-mono">
                  {activeShift.expectedCash.toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-200 block mt-0.5">ج.م كاش حالي</span>
              </div>
            </div>

            {/* Shift Sub-Stats & Drawer Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-700/80">
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  مبيعات إلكتروني / فيزا: <strong className="text-cyan-400 font-mono font-bold">{activeShift.cardSales.toFixed(2)} ج.م</strong>
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  مبيعات آجل على الحساب: <strong className="text-amber-400 font-mono font-bold">{activeShift.creditSales.toFixed(2)} ج.م</strong>
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  إيداعات إضافية بالدرج: <strong className="text-emerald-400 font-mono font-bold">{activeShift.cashDeposits.toFixed(2)} ج.م</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="px-4 py-2 bg-slate-700/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <ArrowDownCircle className="w-4 h-4 text-amber-400" />
                  <span>سحب من الدرج (توريد/مصروف)</span>
                </button>
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="px-4 py-2 bg-slate-700/80 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
                  <span>إيداع بالدرج (تغذية فكة)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">لا توجد وردية مفتوحة حالياً للكاشير</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
              يجب فتح وردية كاشير وتحديد رصيد الفكة الافتتاحي للتمكن من تسجيل المبيعات والتحصيلات في الدرج بدقة وحساب الفوارق.
            </p>
          </div>
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl inline-flex items-center gap-2 shadow-md transition"
          >
            <Clock className="w-5 h-5" />
            <span>فتح وردية جديدة برصيد افتتاحي</span>
          </button>
        </div>
      )}

      {/* Shifts History Log */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <h2 className="font-bold text-slate-800 text-base">سجل الورديات السابقة وإقفالات الكاشير</h2>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {cashierShifts.length} وردية مسجلة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">رقم الوردية</th>
                <th className="p-3.5">الكاشير</th>
                <th className="p-3.5">تاريخ الفتح والإغلاق</th>
                <th className="p-3.5">المبيعات النقدية</th>
                <th className="p-3.5">المتوقع بالدرج</th>
                <th className="p-3.5">الفعلي المعدود</th>
                <th className="p-3.5">الفارق (عجز / زيادة)</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">تقرير Z</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cashierShifts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    لا توجد أي سجلات ورديات سابقة حتى الآن
                  </td>
                </tr>
              ) : (
                cashierShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-700">
                      #{shift.id.slice(-6)}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {shift.cashierName}
                    </td>
                    <td className="p-3.5 text-xs text-slate-500">
                      <div>من: {new Date(shift.openedAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      {shift.closedAt && (
                        <div>إلى: {new Date(shift.closedAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-700">
                      {shift.cashSales.toFixed(2)} ج.م
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">
                      {shift.expectedCash.toFixed(2)} ج.م
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">
                      {shift.actualCash !== undefined ? `${shift.actualCash.toFixed(2)} ج.م` : '—'}
                    </td>
                    <td className="p-3.5">
                      {shift.variance !== undefined ? (
                        shift.variance === 0 ? (
                          <span className="text-xs px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> متطابق (0)
                          </span>
                        ) : shift.variance > 0 ? (
                          <span className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-bold font-mono">
                            +{shift.variance.toFixed(2)} زيادة
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-md bg-red-100 text-red-800 font-bold font-mono">
                            {shift.variance.toFixed(2)} عجز
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-slate-400">قيد التشغيل</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {shift.status === 'OPEN' ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          مفتوحة
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">
                          مغلقة
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedShiftForPrint(shift.id)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="طباعة إيصال الوردية"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Open Shift */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">فتح وردية كاشير جديدة</h3>
                <p className="text-xs text-slate-500">سجل مبلغ الفكة الافتتاحي في درج الكاشير</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الكاشير المسؤول
                </label>
                <div className="p-2.5 bg-slate-100 rounded-xl text-sm font-bold text-slate-800">
                  {currentUser.name} ({currentUser.username})
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رصيد الفكة الافتتاحي بالدرج (ج.م)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  className="w-full text-2xl font-black font-mono text-center p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-2">
                {[100, 200, 300, 500].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setOpeningCashInput(quick.toString())}
                    className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 font-mono transition"
                  >
                    {quick} ج.م
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => setShowOpenModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleOpenShift}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
              >
                تأكيد وبدء الوردية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Close Shift */}
      {showCloseModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">تقفيل وتسليم وردية الكاشير (Z-Report)</h3>
                <p className="text-xs text-slate-500">عد النقدية الفعلية داخل الدرج لمقارنتها بالرصيد المسجل</p>
              </div>
            </div>

            {/* Calculations breakdown */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">رصيد الافتتاح:</span>
                <span className="font-mono font-bold text-slate-800">{activeShift.openingCash.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">+ مبيعات نقدية (درج):</span>
                <span className="font-mono font-bold text-emerald-600">+{activeShift.cashSales.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">+ تحصيلات ديون كاش:</span>
                <span className="font-mono font-bold text-blue-600">+{activeShift.collections.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">- مرتجعات نقدية:</span>
                <span className="font-mono font-bold text-amber-600">-{activeShift.refunds.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">- سحوبات ومصاريف من الدرج:</span>
                <span className="font-mono font-bold text-purple-600">-{activeShift.cashDrops.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">+ إيداعات إضافية بالدرج:</span>
                <span className="font-mono font-bold text-emerald-600">+{activeShift.cashDeposits.toFixed(2)} ج.م</span>
              </div>
              <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-slate-900">
                <span>الرصيد المحاسبي المتوقع بالدرج:</span>
                <span className="font-mono text-emerald-700">{activeShift.expectedCash.toFixed(2)} ج.م</span>
              </div>
            </div>

            {/* Actual count input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                المبلغ الفعلي المعدود بالدرج (العد الحقيقي):
              </label>
              <input
                type="number"
                step="0.5"
                value={actualCashInput}
                onChange={(e) => setActualCashInput(e.target.value)}
                className="w-full text-2xl font-black font-mono text-center p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="أدخل المبلغ بعد العد"
                autoFocus
              />

              {/* Variance live indicator */}
              {actualCashInput !== '' && (
                <div className="p-3 rounded-xl border flex items-center justify-between text-xs font-bold">
                  <span>الفارق (الفعلي - المتوقع):</span>
                  {(() => {
                    const actual = parseFloat(actualCashInput) || 0;
                    const diff = Math.round((actual - activeShift.expectedCash) * 100) / 100;
                    if (diff === 0) {
                      return <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded">مطابق تماماً (0.00 ج.م) ✓</span>;
                    } else if (diff > 0) {
                      return <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded">زيادة (+{diff.toFixed(2)} ج.م)</span>;
                    } else {
                      return <span className="text-red-700 bg-red-50 px-2 py-1 rounded">عجز ({diff.toFixed(2)} ج.م) ⚠</span>;
                    }
                  })()}
                </div>
              )}
            </div>

            {/* Reason note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ملاحظات وتبرير الفارق (إن وجد):
              </label>
              <textarea
                value={varianceNoteInput}
                onChange={(e) => setVarianceNoteInput(e.target.value)}
                rows={2}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                placeholder="أي توضيح بشأن الفكة أو مصاريف لم تُقيد..."
              />
            </div>

            <div className="flex gap-3 pt-3 border-t">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmCloseShift}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition"
              >
                إقفال الوردية وطباعة التقرير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Drawer Withdrawal (Requires Manager PIN) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">سحب نقدية من الدرج (توريد / مصروف)</h3>
                <p className="text-xs text-slate-500">يتطلب موافقة واعتماد المدير بالرقم السري</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المطلوب سحبه (ج.م)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full text-xl font-black font-mono text-center p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب السحب / الجهة المستلمة</label>
                <select
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                >
                  <option value="توريد للخزينة الرئيسية">توريد للخزينة الرئيسية (تفريغ سيولة)</option>
                  <option value="مصروف بوفيه ونظافة">مصروف بوفيه ونظافة</option>
                  <option value="شراء أكياس وتعبئة">شراء أكياس وتعبئة عاجل</option>
                  <option value="سداد نقل وسيارات">سداد نقل وسيارات</option>
                  <option value="سحب عهدة مندوب">سحب عهدة فكة لمندوب دليفري</option>
                  <option value="أخرى">أخرى (مذكورة بالملاحظة)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmWithdrawal}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md"
              >
                طلب اعتماد وسحب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Drawer Deposit */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">إيداع نقدية في الدرج (تغذية)</h3>
                <p className="text-xs text-slate-500">إضافة نقدية إضافية لدرج الكاشير</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المودع (ج.م)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full text-xl font-black font-mono text-center p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مصدر الإيداع / السبب</label>
                <input
                  type="text"
                  value={depositReason}
                  onChange={(e) => setDepositReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="مثال: فكة إضافية من الإدارة"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t">
              <button
                onClick={() => setShowDepositModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmDeposit}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md"
              >
                تأكيد الإيداع بالدرج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Printable Shift Report Modal */}
      {shiftToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h4 className="font-black text-slate-900 text-base">{activeBranch.nameAr}</h4>
              <p className="text-[11px] text-slate-500">تقرير تقفيل وردية الكاشير (Z-Report)</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{shiftToPrint.id}</p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span>الكاشير:</span>
                <span className="font-bold">{shiftToPrint.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>تاريخ الفتح:</span>
                <span className="font-mono">{new Date(shiftToPrint.openedAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              {shiftToPrint.closedAt && (
                <div className="flex justify-between">
                  <span>تاريخ الإغلاق:</span>
                  <span className="font-mono">{new Date(shiftToPrint.closedAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-xs font-mono border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span>رصيد الافتتاح:</span>
                <span>{shiftToPrint.openingCash.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>مبيعات نقدية:</span>
                <span>+{shiftToPrint.cashSales.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>تحصيل ديون كاش:</span>
                <span>+{shiftToPrint.collections.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>مرتجعات نقدية:</span>
                <span>-{shiftToPrint.refunds.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-purple-700">
                <span>سحوبات من الدرج:</span>
                <span>-{shiftToPrint.cashDrops.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-teal-700">
                <span>إيداعات إضافية:</span>
                <span>+{shiftToPrint.cashDeposits.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t">
                <span>المتوقع بالدرج:</span>
                <span>{shiftToPrint.expectedCash.toFixed(2)} ج.م</span>
              </div>
              {shiftToPrint.actualCash !== undefined && (
                <>
                  <div className="flex justify-between font-black text-slate-800">
                    <span>الفعلي المعدود:</span>
                    <span>{shiftToPrint.actualCash.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between font-black text-sm pt-1">
                    <span>الفارق:</span>
                    <span className={shiftToPrint.variance && shiftToPrint.variance < 0 ? 'text-red-600' : 'text-emerald-600'}>
                      {shiftToPrint.variance ? (shiftToPrint.variance > 0 ? `+${shiftToPrint.variance.toFixed(2)} زيادة` : `${shiftToPrint.variance.toFixed(2)} عجز`) : 'متطابق (0)'}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setSelectedShiftForPrint(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة حرارية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager PIN Modal (On-spot authorization) */}
      <ManagerPinModal
        isOpen={showPinModal}
        title={pinTitle}
        description="يتطلب إجراء هذه العملية اعتماد وموافقة المدير بالرقم السري"
        actionLabel="تأكيد واعتماد"
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
