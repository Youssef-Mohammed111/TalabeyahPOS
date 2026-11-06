import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { formatMoney } from '../../utils/accounting.ts';
import {
  Settings,
  Printer,
  Scale,
  Barcode,
  Database,
  Truck,
  Plus,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

export const SettingsScreen: React.FC<{ initialSubTab?: 'general' | 'backup' }> = ({ initialSubTab = 'general' }) => {
  const {
    lang,
    t,
    hardwareSettings,
    updateHardwareSettings,
    deliveryZones,
    addDeliveryZone,
    updateDeliveryZone,
    exportDatabaseJson,
    importDatabaseJson,
    resetToInitialData,
    tenant,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'hardware' | 'zones' | 'backup'>(
    initialSubTab === 'backup' ? 'backup' : 'hardware'
  );

  // New Zone State
  const [newZoneModalOpen, setNewZoneModalOpen] = useState(false);
  const [zoneNameAr, setZoneNameAr] = useState('');
  const [zoneNameEn, setZoneNameEn] = useState('');
  const [zoneFee, setZoneFee] = useState('25');
  const [zoneMinOrder, setZoneMinOrder] = useState('100');
  const [zoneFreeThreshold, setZoneFreeThreshold] = useState('500');

  // Backup status
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `talabeyah_pos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJson(content);
      if (success) {
        setImportStatus('تم استعادة النسخة الاحتياطية بنجاح!');
      } else {
        setImportStatus('خطأ: الملف المرفوع غير صالح أو تالف.');
      }
    };
    reader.readAsText(file);
  };

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneNameAr) return;

    addDeliveryZone({
      nameAr: zoneNameAr,
      nameEn: zoneNameEn || zoneNameAr,
      feeEgp: parseFloat(zoneFee) || 20,
      minOrderValue: parseFloat(zoneMinOrder) || 0,
      freeDeliveryThreshold: parseFloat(zoneFreeThreshold) || 0,
      active: true,
    });

    setZoneNameAr('');
    setZoneNameEn('');
    setNewZoneModalOpen(false);
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>{t.nav.settings} (Hardware, Delivery Zones & SaaS Backup)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'ar'
              ? 'إعدادات الطابعات الحرارية، الموازين الإلكترونية، تسعير مناطق التوصيل والنسخ الاحتياطي'
              : 'Thermal printers, scales, delivery zone fees and database backup'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('hardware')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'hardware'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {lang === 'ar' ? 'الأجهزة والملحقات' : 'Hardware'}
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'zones'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {lang === 'ar' ? 'مناطق التوصيل والأسعار' : 'Delivery Zones'}
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {t.nav.backup}
        </button>
      </div>

      {/* Tab 1: Hardware Settings */}
      {activeTab === 'hardware' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Printer */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Printer className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">طابعة الفواتير والإيصالات الحرارية</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عرض ورق الإيصال</label>
              <select
                value={hardwareSettings.printerType}
                onChange={(e) =>
                  updateHardwareSettings({ ...hardwareSettings, printerType: e.target.value as any })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
              >
                <option value="thermal_80mm">طابعة حرارية 80 ملم (الأكثر شيوعاً للمحلات والمطاعم)</option>
                <option value="thermal_58mm">طابعة حرارية 58 ملم (محمولة / صغيرة)</option>
                <option value="standard_a4">طابعة مكتبية قياسية A4</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autoPrintCheck"
                checked={hardwareSettings.autoPrintReceipt}
                onChange={(e) =>
                  updateHardwareSettings({ ...hardwareSettings, autoPrintReceipt: e.target.checked })
                }
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="autoPrintCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                فتح نافذة الطباعة فور تأكيد البيع
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="drawerKickCheck"
                checked={hardwareSettings.cashDrawerKick}
                onChange={(e) =>
                  updateHardwareSettings({ ...hardwareSettings, cashDrawerKick: e.target.checked })
                }
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="drawerKickCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                فتح درج النقدية تلقائياً بنبضة ESC/POS عند البيع النقدي
              </label>
            </div>
          </div>

          {/* Scale & Scanner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Scale className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">الميزان الإلكتروني وقارئ الباركود</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">وضع الميزان الإلكتروني</label>
              <select
                value={hardwareSettings.scaleMode}
                onChange={(e) =>
                  updateHardwareSettings({ ...hardwareSettings, scaleMode: e.target.value as any })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
              >
                <option value="manual_fallback">كيباد الوزن الدقيق + محاكاة رقمية (الوضع الموصى به)</option>
                <option value="web_serial">منفذ تسلسلي مباشر (WebSerial RS232 / USB)</option>
                <option value="hid_scale">ميزان USB HID كمدخل لوحة مفاتيح</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">قارئ الباركود (سكانر)</label>
              <select
                value={hardwareSettings.scannerMode}
                onChange={(e) =>
                  updateHardwareSettings({ ...hardwareSettings, scannerMode: e.target.value as any })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
              >
                <option value="keyboard_wedge">قارئ USB Keyboard Wedge (بدون تعريفات - جاهز للعمل فوراً)</option>
                <option value="camera">كاميرا الجهاز لمسح الأكواد</option>
              </select>
            </div>

            <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-medium border border-emerald-200">
              قارئ الباركود يعمل مباشرة بمجرد الضغط على Enter في حقل البحث أو مسح أي منتج بالباركود.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Delivery Zones */}
      {activeTab === 'zones' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">
              تحديد أسعار ورسوم التوصيل لكل منطقة جغرافية
            </span>
            <button
              onClick={() => setNewZoneModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منطقة جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {deliveryZones.map((z) => (
              <div key={z.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-slate-900">{lang === 'ar' ? z.nameAr : z.nameEn}</h4>
                  <span className="font-extrabold text-base text-emerald-700">
                    {formatMoney(z.feeEgp, lang)}
                  </span>
                </div>
                <div className="text-xs text-slate-500">{z.areaDescription}</div>
                <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
                  <span>أدنى طلب: {z.minOrderValue} ج.م</span>
                  <span>توصيل مجاني: {z.freeDeliveryThreshold} ج.م</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Download className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">تصدير نسخة احتياطية كاملة (JSON)</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              تحميل ملف نسخة احتياطية مشفر ومنظم يحتوي على كافة المنتجات، الأرصدة، الفواتير، عهد المناديب، حركات الخزينة والعملاء.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>تحميل ملف النسخة الاحتياطية</span>
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">استعادة بيانات من ملف سابق</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              رفع ملف JSON تم تصديره سابقاً للتحقق من صحته واستعادة قاعدة البيانات فوراً.
            </p>

            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-500 file:me-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />

            {importStatus && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                {importStatus}
              </div>
            )}
          </div>

          <div className="col-span-full bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-800">إعادة ضبط البيانات النموذجية للمتجر</h4>
              <p className="text-xs text-slate-500">إعادة تعيين قاعدة البيانات إلى البداية الافتراضية مع المنتجات والمناديب النموذجية.</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('هل أنت متأكد من رغبتك في إعادة تعيين البيانات التجريبية؟')) {
                  resetToInitialData();
                }
              }}
              className="px-3.5 py-2 bg-slate-200 hover:bg-red-50 text-slate-700 hover:text-red-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              إعادة تعيين Demo Data
            </button>
          </div>
        </div>
      )}

      {/* Modal: New Delivery Zone */}
      {newZoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">إضافة منطقة توصيل جديدة</h3>
              <button
                onClick={() => setNewZoneModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateZone} className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنطقة (عربي) *</label>
                <input
                  type="text"
                  required
                  value={zoneNameAr}
                  onChange={(e) => setZoneNameAr(e.target.value)}
                  placeholder="مثال: التجمع الأول"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رسوم التوصيل (ج.م) *</label>
                <input
                  type="number"
                  required
                  value={zoneFee}
                  onChange={(e) => setZoneFee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأدنى للطلب (ج.م)</label>
                <input
                  type="number"
                  value={zoneMinOrder}
                  onChange={(e) => setZoneMinOrder(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
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
