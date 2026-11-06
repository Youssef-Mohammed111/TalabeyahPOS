import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Clock,
  Activity,
  Lock,
  Tag,
} from 'lucide-react';

export const AuditLogScreen: React.FC = () => {
  const { auditLogs, currentUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch =
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  const exportToJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `talabeyah_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">
              سجل المراجعة وتتبع العمليات الحساسة (Audit Trail)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              سجل ثابت وغير قابل للتعديل لجميع العمليات المالية والحركات المحاسبية والاعتمادات الحضورية
            </p>
          </div>
        </div>

        <button
          onClick={exportToJson}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4" />
          <span>تصدير السجل الكامل (JSON)</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث باسم الموظف، نوع العملية، أو التفاصيل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none"
        >
          <option value="ALL">جميع العمليات</option>
          <option value="OPEN_SHIFT">فتح وردية كاشير</option>
          <option value="CLOSE_SHIFT">تقفيل وردية كاشير</option>
          <option value="DRAWER_WITHDRAWAL">سحب نقدية من الدرج</option>
          <option value="DRAWER_DEPOSIT">إيداع نقدية بالدرج</option>
          <option value="CUSTOMER_RETURN">مرتجع عميل</option>
          <option value="PUBLISH_PRICES">نشر أسعار اليوم</option>
          <option value="RECORD_WASTE">تسجيل هالك وتالف</option>
          <option value="STOCK_AUDIT">جلسة جرد فعلي</option>
          <option value="COLLECT_DEBT">تحصيل ديون عميل</option>
          <option value="SALE">فاتورة مبيعات</option>
        </select>
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
          <span>عدد الحركات المسجلة: {filteredLogs.length}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              لا توجد عمليات مسجلة مطابقة للبحث
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4 text-slate-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{log.action}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-600">
                        {log.entityType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(log.timestamp).toLocaleString('ar-EG', {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mb-2">{log.details}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <strong>{log.actorName}</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-slate-400">ID: #{log.id.slice(-6)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
