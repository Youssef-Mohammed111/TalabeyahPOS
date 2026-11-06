import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { Product, UnitType } from '../../types/index.ts';
import { formatMoney, roundMoney } from '../../utils/accounting.ts';
import { calculateAvailableStock } from '../../utils/inventory.ts';
import {
  Package,
  Plus,
  SlidersHorizontal,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  X,
  Scale,
  ArrowUpDown,
  History,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const {
    lang,
    t,
    products,
    categories,
    stocks,
    activeBranch,
    addProduct,
    recordStockAdjustment,
    movements,
    updateProductImage,
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'table' | 'gallery' | 'movements'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  // Photo management modal state
  const [photoModalProduct, setPhotoModalProduct] = useState<Product | null>(null);
  const [photoInputUrl, setPhotoInputUrl] = useState('');

  // Modals
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustNewQty, setAdjustNewQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('تسوية جرد دوري');

  const [newProductModalOpen, setNewProductModalOpen] = useState(false);
  const [newProductNameAr, setNewProductNameAr] = useState('');
  const [newProductNameEn, setNewProductNameEn] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductBarcode, setNewProductBarcode] = useState('');
  const [newProductCatId, setNewProductCatId] = useState(categories[0]?.id || '');
  const [newProductCost, setNewProductCost] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductUnit, setNewProductUnit] = useState<UnitType>('kg');
  const [newProductWeightBased, setNewProductWeightBased] = useState(true);
  const [newProductMinStock, setNewProductMinStock] = useState('10');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'all' && p.categoryId !== categoryFilter) return false;

    const stock = stocks.find((s) => s.productId === p.id && s.branchId === activeBranch.id);
    const available = stock ? calculateAvailableStock(stock) : 0;

    if (stockStatusFilter === 'out' && available > 0) return false;
    if (stockStatusFilter === 'low' && (available > p.minStock || available === 0)) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.nameAr.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  const productsWithImage = products.filter((p) => Boolean(p.imageUrl));
  const imageCompletenessPercent = Math.round((productsWithImage.length / (products.length || 1)) * 100);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;
    const qty = parseFloat(adjustNewQty);
    if (isNaN(qty) || qty < 0) return;

    recordStockAdjustment(adjustModalProduct.id, qty, adjustReason);
    setAdjustModalProduct(null);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductNameAr || !newProductPrice) return;

    addProduct({
      sku: newProductSku || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: newProductBarcode || Date.now().toString().slice(-8),
      nameAr: newProductNameAr,
      nameEn: newProductNameEn || newProductNameAr,
      categoryId: newProductCatId,
      imageUrl: newProductImageUrl || undefined,
      purchaseCost: parseFloat(newProductCost) || 0,
      sellingPrice: parseFloat(newProductPrice) || 0,
      baseUnit: newProductUnit,
      weightBased: newProductWeightBased,
      minStock: parseFloat(newProductMinStock) || 5,
      active: true,
      trackStock: true,
    });

    setNewProductNameAr('');
    setNewProductNameEn('');
    setNewProductSku('');
    setNewProductBarcode('');
    setNewProductCost('');
    setNewProductPrice('');
    setNewProductImageUrl('');
    setNewProductModalOpen(false);
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span>{t.inventory.stockOverview}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'ar'
              ? 'متابعة الأرصدة الفعلية والمحجوزة وبعهدة الدليفري، متوسط التكلفة والتسويات الجردية'
              : 'Physical, reserved, and driver stock with weighted-average costs'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtabs switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setActiveSubTab('table')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeSubTab === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              {lang === 'ar' ? 'جدول الأرصدة' : 'Stock Table'}
            </button>
            <button
              onClick={() => setActiveSubTab('gallery')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'gallery' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'ar' ? 'معرض الصور' : 'Photo Gallery'}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                {imageCompletenessPercent}%
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('movements')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeSubTab === 'movements' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              {lang === 'ar' ? 'سجل الحركات' : 'Movements'}
            </button>
          </div>

          <button
            onClick={() => setNewProductModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t.inventory.newProduct}</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Standard Table View */}
      {activeSubTab === 'table' && (
        <>
          {/* Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">{t.pos.allCategories}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === 'ar' ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setStockStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  stockStatusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.common.all}
              </button>
              <button
                onClick={() => setStockStatusFilter('low')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  stockStatusFilter === 'low' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                {lang === 'ar' ? 'نواقص وقرب النفاد' : 'Low Stock'}
              </button>
              <button
                onClick={() => setStockStatusFilter('out')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  stockStatusFilter === 'out' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                {lang === 'ar' ? 'منتهي من المخزن' : 'Out of Stock'}
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.pos.searchPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg ps-9 pe-3 py-1.5 text-xs focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-start">{t.inventory.productName}</th>
                    <th className="p-3 text-start">SKU / الباركود</th>
                    <th className="p-3 text-start">{t.inventory.purchaseCost}</th>
                    <th className="p-3 text-start">{t.inventory.sellingPrice}</th>
                    <th className="p-3 text-start">{t.inventory.physicalStock}</th>
                    <th className="p-3 text-start">{t.inventory.reservedStock}</th>
                    <th className="p-3 text-start">{t.inventory.inTransitStock}</th>
                    <th className="p-3 text-start">{t.inventory.damagedStock}</th>
                    <th className="p-3 text-start">{t.inventory.availableStock}</th>
                    <th className="p-3 text-end">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const stock = stocks.find((s) => s.productId === p.id && s.branchId === activeBranch.id) || {
                      physicalQty: 0,
                      reservedQty: 0,
                      inTransitQty: 0,
                      damagedQty: 0,
                      awaitingInspectionQty: 0,
                    };
                    const available = calculateAvailableStock(stock as any);
                    const isLow = available <= p.minStock && available > 0;
                    const isOut = available <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            {/* Product Thumbnail with hover edit trigger */}
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 relative group/thumb">
                              <img
                                src={p.imageUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&auto=format&fit=crop&q=80'}
                                alt={p.nameAr}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setPhotoModalProduct(p);
                                  setPhotoInputUrl(p.imageUrl || '');
                                }}
                                title={lang === 'ar' ? 'تعديل الصورة' : 'Edit Photo'}
                                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                {p.weightBased && <Scale className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                <span>{lang === 'ar' ? p.nameAr : p.nameEn}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {categories.find((c) => c.id === p.categoryId)?.[lang === 'ar' ? 'nameAr' : 'nameEn']}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          <div>{p.sku}</div>
                          <div className="text-[10px] text-slate-400">{p.barcode}</div>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          {formatMoney(p.purchaseCost, lang)}
                        </td>
                        <td className="p-3 font-bold text-emerald-700">
                          {formatMoney(p.sellingPrice, lang)}
                        </td>
                        <td className="p-3 font-extrabold text-slate-800">
                          {stock.physicalQty} {p.baseUnit}
                        </td>
                        <td className="p-3 text-slate-600">
                          {stock.reservedQty > 0 ? `${stock.reservedQty} ${p.baseUnit}` : '—'}
                        </td>
                        <td className="p-3 text-purple-700 font-semibold">
                          {stock.inTransitQty > 0 ? `${stock.inTransitQty} ${p.baseUnit}` : '—'}
                        </td>
                        <td className="p-3 text-red-600">
                          {stock.damagedQty > 0 ? `${stock.damagedQty} ${p.baseUnit}` : '—'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-extrabold px-2 py-0.5 rounded-full text-xs ${
                              isOut
                                ? 'bg-red-100 text-red-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {available} {p.baseUnit}
                          </span>
                        </td>
                        <td className="p-3 text-end">
                          <button
                            onClick={() => {
                              setAdjustModalProduct(p);
                              setAdjustNewQty(stock.physicalQty.toString());
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            {t.inventory.stockAdjustment}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Subtab 2: Visual Produce Gallery & Completeness Manager */}
      {activeSubTab === 'gallery' && (
        <div className="space-y-4">
          {/* Completeness banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-5 rounded-2xl shadow-lg border border-emerald-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {lang === 'ar' ? 'مؤشر اكتمال وتوثيق صور المنتجات الطازجة' : 'Produce Photography Completeness'}
                </h3>
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed max-w-xl">
                {lang === 'ar'
                  ? 'وجود صور فوتوغرافية واقعية وعالية الجودة لكل صنف يُمكّن الكاشير من التعرف الفوري على الخضار والفاكهة ويسرع إدخال الوزن بدون أخطاء.'
                  : 'High-resolution realistic produce photos allow cashiers to instantly recognize fruits and vegetables and speed up checkout.'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shrink-0 text-center min-w-[140px]">
              <div className="text-3xl font-black text-amber-300">{imageCompletenessPercent}%</div>
              <div className="text-xs text-white/90 font-semibold mt-0.5">
                {productsWithImage.length} / {products.length} {lang === 'ar' ? 'أصناف موثقة' : 'with photos'}
              </div>
            </div>
          </div>

          {/* Grid of Produce Cards with Large Images */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {products.map((p) => {
              const hasImage = Boolean(p.imageUrl);
              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between p-3 group hover:border-emerald-500 transition-all"
                >
                  <div>
                    <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 relative mb-2.5 border border-slate-100 shadow-inner">
                      {hasImage ? (
                        <img
                          src={p.imageUrl}
                          alt={p.nameAr}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                          <ImageIcon className="w-8 h-8 stroke-1 mb-1" />
                          <span className="text-[10px]">{lang === 'ar' ? 'لا توجد صورة' : 'No photo'}</span>
                        </div>
                      )}

                      <div className="absolute top-1.5 start-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                          {p.sku}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 mb-0.5">
                      {lang === 'ar' ? p.nameAr : p.nameEn}
                    </h4>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {formatMoney(p.sellingPrice, lang)} / {p.baseUnit}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        hasImage ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {hasImage ? (lang === 'ar' ? 'صورة موثقة' : 'Photo Active') : (lang === 'ar' ? 'صورة مفقودة' : 'Missing')}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setPhotoModalProduct(p);
                        setPhotoInputUrl(p.imageUrl || '');
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-slate-600 transition-colors cursor-pointer"
                      title={lang === 'ar' ? 'تعديل الصورة' : 'Change Photo'}
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 3: Stock Movement Ledger */}
      {activeSubTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              {lang === 'ar' ? 'سجل حركات المخزون والتدقيق الرقابي' : 'Inventory Movements Audit Log'}
            </h3>
          </div>

          {movements.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {lang === 'ar'
                ? 'لا توجد حركات مخزنية مسجلة حتى الآن. ستظهر حركات الخصم مع كل عملية بيع واستلام وتسويه.'
                : 'No inventory movements recorded yet. Sales, receipts, and returns will appear here.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 text-start">{lang === 'ar' ? 'الوقت' : 'Timestamp'}</th>
                    <th className="p-2.5 text-start">{lang === 'ar' ? 'الصنف' : 'Product'}</th>
                    <th className="p-2.5 text-start">{lang === 'ar' ? 'نوع الحركة' : 'Type'}</th>
                    <th className="p-2.5 text-start">{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                    <th className="p-2.5 text-start">{lang === 'ar' ? 'تكلفة الوحدة' : 'Unit Cost'}</th>
                    <th className="p-2.5 text-start">{lang === 'ar' ? 'المرجع والسبب' : 'Reference & Reason'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.slice(0, 30).map((m) => {
                    const prod = products.find((p) => p.id === m.productId);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80">
                        <td className="p-2.5 font-mono text-slate-500">{m.timestamp.slice(11, 19)}</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {prod ? (lang === 'ar' ? prod.nameAr : prod.nameEn) : m.productId}
                        </td>
                        <td className="p-2.5">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                            {m.movementType}
                          </span>
                        </td>
                        <td
                          className={`p-2.5 font-extrabold ${
                            m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">{m.unitCost ? `${m.unitCost} ج.م` : '—'}</td>
                        <td className="p-2.5 text-slate-500">{m.reason || m.referenceId || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Photo Upload & Presets */}
      {photoModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {lang === 'ar' ? 'تعديل صورة الصنف' : 'Update Produce Photo'}
                </h3>
              </div>
              <button
                onClick={() => setPhotoModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3">
              <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-3 flex items-center justify-center">
                {photoInputUrl ? (
                  <img src={photoInputUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-slate-400">{lang === 'ar' ? 'معاينة الصورة' : 'Image Preview'}</span>
                )}
              </div>

              {/* Upload file */}
              <label className="flex items-center justify-center gap-2 w-full p-2.5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 font-bold text-xs cursor-pointer transition-colors mb-3">
                <Upload className="w-4 h-4" />
                <span>{lang === 'ar' ? 'رفع صورة من جهازك' : 'Upload from Device'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      if (typeof reader.result === 'string') {
                        setPhotoInputUrl(reader.result);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>

              {/* URL */}
              <input
                type="url"
                value={photoInputUrl}
                onChange={(e) => setPhotoInputUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 mb-3"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPhotoInputUrl('')}
                className="text-xs text-rose-600 font-bold cursor-pointer"
              >
                {lang === 'ar' ? 'حذف الصورة' : 'Clear'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoModalProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (photoModalProduct) {
                      updateProductImage(photoModalProduct.id, photoInputUrl);
                      setPhotoModalProduct(null);
                    }
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                >
                  {t.common.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Stock Adjustment */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
                <span>{t.inventory.stockAdjustment}</span>
              </h3>
              <button
                onClick={() => setAdjustModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="py-4 space-y-3">
              <div className="bg-slate-50 p-2.5 rounded-xl text-xs font-bold text-slate-800">
                {lang === 'ar' ? adjustModalProduct.nameAr : adjustModalProduct.nameEn}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الرصيد الفعلي الجديد بعد الجرد ({adjustModalProduct.baseUnit}) *
                </label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={adjustNewQty}
                  onChange={(e) => setAdjustNewQty(e.target.value)}
                  className="w-full text-xl font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سبب التسوية الجردية *
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
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

      {/* Modal: New Product */}
      {newProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>{t.inventory.newProduct}</span>
              </h3>
              <button
                onClick={() => setNewProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الصنف (بالعربية) *
                </label>
                <input
                  type="text"
                  required
                  value={newProductNameAr}
                  onChange={(e) => setNewProductNameAr(e.target.value)}
                  placeholder="مثال: ليمون أضاليا فاخر"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الصنف (بالإنجليزية)
                </label>
                <input
                  type="text"
                  value={newProductNameEn}
                  onChange={(e) => setNewProductNameEn(e.target.value)}
                  placeholder="e.g. Fresh Lemons"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Photo Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  صورة الصنف (اختياري)
                </label>
                <input
                  type="url"
                  value={newProductImageUrl}
                  onChange={(e) => setNewProductImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    التصنيف *
                  </label>
                  <select
                    value={newProductCatId}
                    onChange={(e) => setNewProductCatId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {lang === 'ar' ? c.nameAr : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    كود الصنف (SKU)
                  </label>
                  <input
                    type="text"
                    value={newProductSku}
                    onChange={(e) => setNewProductSku(e.target.value)}
                    placeholder="VEG-006"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سعر الشراء / التكلفة (ج.م)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={newProductCost}
                    onChange={(e) => setNewProductCost(e.target.value)}
                    placeholder="15.00"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سعر البيع للجمهور (ج.م) *
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="22.00"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    وحدة القياس
                  </label>
                  <select
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                  >
                    <option value="kg">كيلوجرام (kg)</option>
                    <option value="piece">قطعة / حزمة (piece)</option>
                    <option value="box">صندوق (box)</option>
                    <option value="carton">كرتونة (carton)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    حد إعادة الطلب (أدنى مخزون)
                  </label>
                  <input
                    type="number"
                    value={newProductMinStock}
                    onChange={(e) => setNewProductMinStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="weightBasedCheckbox"
                  checked={newProductWeightBased}
                  onChange={(e) => setNewProductWeightBased(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="weightBasedCheckbox" className="text-xs font-bold text-slate-800 cursor-pointer">
                  صنف وزني (يدعم أوزان عشرية وكيباد الميزان)
                </label>
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
