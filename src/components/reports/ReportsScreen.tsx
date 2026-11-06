import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { formatMoney, roundMoney } from '../../utils/accounting.ts';
import { calculateAvailableStock } from '../../utils/inventory.ts';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Truck,
  Package,
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const {
    lang,
    t,
    salesInvoices,
    products,
    stocks,
    drivers,
    deliveryOrders,
    activeBranch,
  } = useStore();

  const [reportTab, setReportTab] = useState<'sales' | 'inventory' | 'drivers'>('sales');

  const branchInvoices = salesInvoices.filter((i) => i.branchId === activeBranch.id && i.status === 'COMPLETED');

  // Sales by product aggregation
  const productSalesMap: Record<string, { nameAr: string; nameEn: string; qty: number; revenue: number; cost: number }> = {};
  branchInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          nameAr: item.productNameAr,
          nameEn: item.productNameEn,
          qty: 0,
          revenue: 0,
          cost: 0,
        };
      }
      productSalesMap[item.productId].qty = roundMoney(productSalesMap[item.productId].qty + item.quantity);
      productSalesMap[item.productId].revenue = roundMoney(productSalesMap[item.productId].revenue + item.total);
      productSalesMap[item.productId].cost = roundMoney(productSalesMap[item.productId].cost + item.quantity * item.purchaseCost);
    });
  });

  const productSalesList = Object.values(productSalesMap);

  // Inventory valuation
  const inventoryValuationTotal = products.reduce((sum, p) => {
    const stock = stocks.find((s) => s.productId === p.id && s.branchId === activeBranch.id);
    const qty = stock ? stock.physicalQty : 0;
    return sum + roundMoney(qty * p.purchaseCost);
  }, 0);

  // Driver performance
  const driverPerformanceList = drivers.map((driver) => {
    const driverOrders = deliveryOrders.filter((o) => o.assignedDriverId === driver.id && o.deliveryStatus === 'DELIVERED');
    const totalCollected = driverOrders.reduce((sum, o) => sum + o.paidAmount, 0);
    const feesCollected = driverOrders.reduce((sum, o) => sum + o.deliveryFee, 0);
    return {
      driver,
      deliveredCount: driverOrders.length,
      totalCollected,
      feesCollected,
    };
  });

  // Export to CSV with UTF-8 BOM for Excel Arabic compatibility
  const exportCsv = (filename: string, rows: (string | number)[][]) => {
    const csvContent = '\uFEFF' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel .xls (HTML table format compatible with Excel 2003+)
  const exportExcelXls = (filename: string, headers: string[], dataRows: (string | number)[][]) => {
    let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"></head>
    <body dir="rtl">
    <table border="1">
      <thead>
        <tr style="background-color: #10b981; color: white; font-weight: bold;">
          ${headers.map((h) => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${dataRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
    </body></html>`;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSales = () => {
    const headers = ['اسم الصنف', 'الكمية المباعة', 'إجمالي الإيراد', 'تكلفة البضاعة', 'مجمل الربح'];
    const rows = productSalesList.map((p) => [
      lang === 'ar' ? p.nameAr : p.nameEn,
      p.qty,
      p.revenue,
      p.cost,
      roundMoney(p.revenue - p.cost),
    ]);
    exportCsv('talabeyah_sales_report', [headers, ...rows]);
  };

  const handleExportExcelSales = () => {
    const headers = ['اسم الصنف', 'الكمية المباعة', 'إجمالي الإيراد (ج.م)', 'التكلفة (ج.م)', 'مجمل الربح (ج.م)'];
    const rows = productSalesList.map((p) => [
      lang === 'ar' ? p.nameAr : p.nameEn,
      p.qty,
      p.revenue,
      p.cost,
      roundMoney(p.revenue - p.cost),
    ]);
    exportExcelXls('talabeyah_sales_report', headers, rows);
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>{t.reports.title} (Financial & Operational Analytics)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'ar'
              ? 'تقارير المبيعات، أرباح الأصناف، تقييم المخزون وأداء تحصيلات المناديب مع تصدير CSV و Excel'
              : 'Sales by item, gross margins, inventory valuation and driver collection performance'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSales}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{t.reports.exportCsv}</span>
          </button>

          <button
            onClick={handleExportExcelSales}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t.reports.exportExcel}</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setReportTab('sales')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            reportTab === 'sales'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {t.reports.salesByProduct}
        </button>
        <button
          onClick={() => setReportTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            reportTab === 'inventory'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {lang === 'ar' ? 'تقييم المخزون' : 'Stock Valuation'}
        </button>
        <button
          onClick={() => setReportTab('drivers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            reportTab === 'drivers'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {t.reports.driverPerformance}
        </button>
      </div>

      {/* Tab Content 1: Sales by Product & Margins */}
      {reportTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex justify-between">
            <span>مبيعات وأرباح الأصناف الموثقة</span>
            <span>عدد الأصناف المباعة: {productSalesList.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">{t.inventory.productName}</th>
                  <th className="p-3 text-start">الكمية المباعة</th>
                  <th className="p-3 text-start">إجمالي الإيرادات</th>
                  <th className="p-3 text-start">تكلفة البضاعة المباعة</th>
                  <th className="p-3 text-start">مجمل الربح (Gross Profit)</th>
                  <th className="p-3 text-start">هامش الربح %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productSalesList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      لا توجد مبيعات مسجلة في هذه الفترة بعد
                    </td>
                  </tr>
                ) : (
                  productSalesList.map((item, idx) => {
                    const gross = roundMoney(item.revenue - item.cost);
                    const margin = item.revenue > 0 ? roundMoney((gross / item.revenue) * 100) : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">{lang === 'ar' ? item.nameAr : item.nameEn}</td>
                        <td className="p-3 font-bold text-slate-700">{item.qty}</td>
                        <td className="p-3 font-bold text-slate-900">{formatMoney(item.revenue, lang)}</td>
                        <td className="p-3 text-slate-600">{formatMoney(item.cost, lang)}</td>
                        <td className="p-3 font-extrabold text-emerald-700">+{formatMoney(gross, lang)}</td>
                        <td className="p-3 font-bold text-emerald-800">{margin}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Stock Valuation */}
      {reportTab === 'inventory' && (
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-800">إجمالي القيمة المالية للمخزون الحالي</span>
              <p className="text-[11px] text-emerald-700 mt-0.5">محسوبة بـ (الرصيد الفعلي للمنتج × متوسط سعر الشراء)</p>
            </div>
            <div className="text-2xl font-extrabold text-emerald-900">
              {formatMoney(inventoryValuationTotal, lang)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-start">{t.inventory.productName}</th>
                    <th className="p-3 text-start">الرصيد الفعلي</th>
                    <th className="p-3 text-start">{t.inventory.purchaseCost}</th>
                    <th className="p-3 text-start">القيمة الإجمالية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const stock = stocks.find((s) => s.productId === p.id && s.branchId === activeBranch.id);
                    const qty = stock ? stock.physicalQty : 0;
                    const val = roundMoney(qty * p.purchaseCost);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">{lang === 'ar' ? p.nameAr : p.nameEn}</td>
                        <td className="p-3 font-bold text-slate-800">{qty} {p.baseUnit}</td>
                        <td className="p-3 text-slate-600">{formatMoney(p.purchaseCost, lang)}</td>
                        <td className="p-3 font-extrabold text-slate-900">{formatMoney(val, lang)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Driver Performance */}
      {reportTab === 'drivers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">المندوب</th>
                  <th className="p-3 text-start">الهاتف</th>
                  <th className="p-3 text-start">عدد الطلبات المسلّمة</th>
                  <th className="p-3 text-start">إجمالي المبالغ المحصلة</th>
                  <th className="p-3 text-start">رسوم التوصيل المحصلة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {driverPerformanceList.map((dp) => (
                  <tr key={dp.driver.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">{dp.driver.name}</td>
                    <td className="p-3 text-slate-500 font-mono" dir="ltr">{dp.driver.phone}</td>
                    <td className="p-3 font-bold text-slate-800">{dp.deliveredCount}</td>
                    <td className="p-3 font-extrabold text-emerald-700">{formatMoney(dp.totalCollected, lang)}</td>
                    <td className="p-3 font-bold text-purple-700">{formatMoney(dp.feesCollected, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
