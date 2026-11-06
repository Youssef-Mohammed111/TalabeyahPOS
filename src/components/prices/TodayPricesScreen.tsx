import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  DollarSign,
  Search,
  Sparkles,
  Percent,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

export const TodayPricesScreen: React.FC = () => {
  const { products, stocks, categories, todayPrices, publishTodayPrices, activeBranch, currentUser } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Local state for prices being edited before publishing
  const [priceDrafts, setPriceDrafts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    products.forEach((p) => {
      const existing = todayPrices.find((tp) => tp.productId === p.id);
      init[p.id] = existing ? existing.sellingPrice : p.sellingPrice;
    });
    return init;
  });

  const [publishedSuccess, setPublishedSuccess] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchSearch = p.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) || p.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const handlePriceChange = (productId: string, val: number) => {
    setPriceDrafts((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleApplyBulkPercentage = (percent: number) => {
    setPriceDrafts((prev) => {
      const next = { ...prev };
      filteredProducts.forEach((p) => {
        const current = next[p.id] || p.sellingPrice;
        next[p.id] = Math.round((current * (1 + percent / 100)) * 2) / 2; // round to 0.50
      });
      return next;
    });
  };

  const handlePublishAll = () => {
    const priceList = products.map((p) => {
      return {
        productId: p.id,
        price: priceDrafts[p.id] !== undefined ? priceDrafts[p.id] : p.sellingPrice,
      };
    });

    publishTodayPrices(priceList);
    setPublishedSuccess(true);
    setTimeout(() => setPublishedSuccess(false), 4000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">
              أسعار اليوم (بورصة الخضار والفاكهة)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              تحديث ونشر أسعار البيع اليومية للكاشير بناءً على أسعار أسواق الجملة الصباحية (سوق العبور/أكتوبر)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {publishedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>تم نشر الأسعار وتحديث شاشة الكاشير بنجاح!</span>
            </div>
          )}
          <button
            onClick={handlePublishAll}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>نشر وتطبيق أسعار اليوم للكاشير</span>
          </button>
        </div>
      </div>

      {/* Bulk Quick Bar & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث باسم الصنف (طماطم، بطاطس، موز...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              جميع الأقسام
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.nameAr}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-600">تعديل جماعي سريع للأصناف المعروضة:</span>
          <button
            onClick={() => handleApplyBulkPercentage(5)}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold border border-emerald-200 transition"
          >
            +5% زيادة
          </button>
          <button
            onClick={() => handleApplyBulkPercentage(10)}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold border border-emerald-200 transition"
          >
            +10% زيادة
          </button>
          <button
            onClick={() => handleApplyBulkPercentage(-5)}
            className="px-2.5 py-1 rounded-lg bg-red-50 text-red-800 hover:bg-red-100 font-bold border border-red-200 transition"
          >
            -5% تخفيض
          </button>
          <button
            onClick={() => {
              const reset: Record<string, number> = {};
              products.forEach((p) => {
                reset[p.id] = p.sellingPrice;
              });
              setPriceDrafts(reset);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition"
          >
            استعادة الأسعار الحالية
          </button>
        </div>
      </div>

      {/* Pricing Grid / Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">الصنف</th>
                <th className="p-3.5">الوحدة</th>
                <th className="p-3.5">تكلفة الشراء (متوسط مرجح)</th>
                <th className="p-3.5">سعر الأمس</th>
                <th className="p-3.5 w-48 text-center">سعر البيع المقترح لليوم (ج.م)</th>
                <th className="p-3.5">التغير عن الأمس</th>
                <th className="p-3.5">هامش الربح المتوقع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const cost = product.purchaseCost || 0;
                const yesterday = todayPrices.find((tp) => tp.productId === product.id)?.yesterdayPrice || product.sellingPrice;
                const todayPrice = priceDrafts[product.id] !== undefined ? priceDrafts[product.id] : product.sellingPrice;

                const diff = Math.round((todayPrice - yesterday) * 100) / 100;
                const profit = todayPrice - cost;
                const marginPercent = todayPrice > 0 ? Math.round((profit / todayPrice) * 100) : 0;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold text-slate-800 text-sm">
                      <div className="flex items-center gap-2">
                        <div>
                          <span>{product.nameAr}</span>
                          <span className="text-[10px] text-slate-400 block font-normal font-mono">
                            {product.nameEn}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-600 font-medium">
                      {product.baseUnit === 'kg' ? 'كيلوجرام' : product.baseUnit === 'piece' ? 'بالقطعة' : product.baseUnit}
                    </td>

                    <td className="p-3.5 font-mono font-bold text-slate-700">
                      {cost.toFixed(2)} ج.م
                    </td>

                    <td className="p-3.5 font-mono text-slate-500">
                      {yesterday.toFixed(2)} ج.م
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handlePriceChange(product.id, Math.max(0, todayPrice - 0.5))}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={todayPrice}
                          onChange={(e) => handlePriceChange(product.id, parseFloat(e.target.value) || 0)}
                          className="w-24 text-center font-black font-mono text-base p-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                        <button
                          onClick={() => handlePriceChange(product.id, todayPrice + 0.5)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5">
                      {diff === 0 ? (
                        <span className="text-slate-400 text-xs">ثابت (0.00)</span>
                      ) : diff > 0 ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold text-xs inline-flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" />
                          +{diff.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded font-mono font-bold text-xs inline-flex items-center gap-0.5">
                          <TrendingDown className="w-3 h-3" />
                          {diff.toFixed(2)}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-mono">
                      <span
                        className={`font-bold ${
                          marginPercent >= 20
                            ? 'text-emerald-700'
                            : marginPercent >= 10
                            ? 'text-amber-700'
                            : 'text-red-600'
                        }`}
                      >
                        {profit.toFixed(2)} ج.م ({marginPercent}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
