import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { DeliveryOrder, DeliveryStatus, CartItem } from '../../types/index.ts';
import { formatMoney, roundMoney } from '../../utils/accounting.ts';
import {
  Truck,
  Plus,
  Bike,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  User,
  Search,
  Filter,
  X,
  Package,
} from 'lucide-react';

export const DispatchBoard: React.FC = () => {
  const {
    lang,
    t,
    deliveryOrders,
    deliveryZones,
    drivers,
    products,
    customers,
    activeBranch,
    createDeliveryOrder,
    dispatchDeliveryOrder,
    updateDeliveryStatus,
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);

  // New Order Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(deliveryZones[0]?.id || '');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [customerInstructions, setCustomerInstructions] = useState('');

  // Deliver modal state
  const [collectModalOrder, setCollectModalOrder] = useState<DeliveryOrder | null>(null);
  const [collectedAmountInput, setCollectedAmountInput] = useState<string>('');

  // Filter orders
  const branchOrders = deliveryOrders.filter((o) => o.branchId === activeBranch.id);

  const filteredOrders = branchOrders.filter((o) => {
    if (statusFilter !== 'all' && o.deliveryStatus !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.deliveryAddress.toLowerCase().includes(q)
    );
  });

  const selectedZone = deliveryZones.find((z) => z.id === selectedZoneId) || deliveryZones[0];

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !deliveryAddress || orderItems.length === 0) return;

    // Build cart items
    const cartItems: CartItem[] = orderItems.map((oi) => {
      const prod = products.find((p) => p.id === oi.productId)!;
      const total = roundMoney(oi.quantity * prod.sellingPrice);
      return {
        productId: prod.id,
        productNameAr: prod.nameAr,
        productNameEn: prod.nameEn,
        sku: prod.sku,
        barcode: prod.barcode,
        weightBased: prod.weightBased,
        unit: prod.baseUnit,
        quantity: oi.quantity,
        unitPrice: prod.sellingPrice,
        purchaseCost: prod.purchaseCost,
        discount: 0,
        total,
      };
    });

    const productSubtotal = cartItems.reduce((sum, it) => sum + it.total, 0);
    const deliveryFee = selectedZone ? selectedZone.feeEgp : 20.0;
    const totalAmount = roundMoney(productSubtotal + deliveryFee);

    createDeliveryOrder({
      customerId: undefined,
      customerName,
      customerPhone,
      deliveryAddress,
      zoneId: selectedZone.id,
      zoneNameAr: selectedZone.nameAr,
      zoneNameEn: selectedZone.nameEn,
      deliveryFee,
      items: cartItems,
      productSubtotal,
      totalAmount,
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      remainingBalance: totalAmount,
      deliveryStatus: 'READY_FOR_DISPATCH',
      createdBy: 'dispatcher',
      customerInstructions,
    });

    // Reset and close
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setOrderItems([]);
    setCustomerInstructions('');
    setNewOrderModalOpen(false);
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    const badges: Record<DeliveryStatus, { bg: string; text: string; labelAr: string; labelEn: string }> = {
      DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700', labelAr: 'مسودة', labelEn: 'Draft' },
      CONFIRMED: { bg: 'bg-blue-50', text: 'text-blue-700', labelAr: 'مؤكد', labelEn: 'Confirmed' },
      PREPARING: { bg: 'bg-indigo-50', text: 'text-indigo-700', labelAr: 'جاري التجهيز', labelEn: 'Preparing' },
      READY_FOR_DISPATCH: { bg: 'bg-amber-50', text: 'text-amber-700', labelAr: 'جاهز للإسناد', labelEn: 'Ready' },
      ASSIGNED: { bg: 'bg-sky-50', text: 'text-sky-700', labelAr: 'مسند للمندوب', labelEn: 'Assigned' },
      DISPATCHED: { bg: 'bg-purple-50', text: 'text-purple-700', labelAr: 'خرج للتوصيل', labelEn: 'Dispatched' },
      ON_THE_WAY: { bg: 'bg-purple-100', text: 'text-purple-800', labelAr: 'في الطريق للعميل', labelEn: 'On Way' },
      DELIVERED: { bg: 'bg-emerald-100', text: 'text-emerald-800', labelAr: 'تم التسليم', labelEn: 'Delivered' },
      PARTIALLY_DELIVERED: { bg: 'bg-teal-50', text: 'text-teal-800', labelAr: 'تسليم جزئي', labelEn: 'Partial' },
      FAILED: { bg: 'bg-red-50', text: 'text-red-700', labelAr: 'فشل التسليم', labelEn: 'Failed' },
      RETURNED: { bg: 'bg-orange-50', text: 'text-orange-700', labelAr: 'مرتجع للمحل', labelEn: 'Returned' },
      CANCELLED: { bg: 'bg-slate-200', text: 'text-slate-600', labelAr: 'ملغي', labelEn: 'Cancelled' },
    };

    const b = badges[status] || badges.DRAFT;
    return (
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${b.bg} ${b.text}`}>
        {lang === 'ar' ? b.labelAr : b.labelEn}
      </span>
    );
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <span>{t.delivery.dispatchBoard}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'ar'
              ? 'متابعة وتوزيع طلبيات التوصيل، الإسناد للمناديب وتتبع التحصيل'
              : 'Dispatch board, driver assignments and delivery collection tracking'}
          </p>
        </div>

        <button
          onClick={() => {
            if (products.length > 0) {
              setOrderItems([{ productId: products[0].id, quantity: 2 }]);
            }
            setNewOrderModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t.delivery.newOrder}</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', labelAr: 'الكل', labelEn: 'All' },
            { id: 'READY_FOR_DISPATCH', labelAr: 'جاهز للإسناد', labelEn: 'Ready' },
            { id: 'DISPATCHED', labelAr: 'مع المندوب', labelEn: 'Dispatched' },
            { id: 'DELIVERED', labelAr: 'تم التسليم', labelEn: 'Delivered' },
            { id: 'FAILED', labelAr: 'فشل / مرتجع', labelEn: 'Failed/Returned' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === st.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lang === 'ar' ? st.labelAr : st.labelEn}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.common.search}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg ps-9 pe-3 py-1.5 text-xs focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Orders List / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            <Truck className="w-12 h-12 stroke-1 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium">لا توجد طلبيات مطابقة للفلتر المحدد</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isDispatched = order.deliveryStatus === 'DISPATCHED' || order.deliveryStatus === 'ON_THE_WAY';
            const isDelivered = order.deliveryStatus === 'DELIVERED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative"
              >
                <div>
                  {/* Top: Order # & Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {order.orderNumber}
                    </span>
                    {getStatusBadge(order.deliveryStatus)}
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-1 mb-3">
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customerName}</span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span dir="ltr">{order.customerPhone}</span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-start gap-1.5 leading-snug">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{order.deliveryAddress} ({lang === 'ar' ? order.zoneNameAr : order.zoneNameEn})</span>
                    </div>
                  </div>

                  {/* Order Items summary */}
                  <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1 mb-3">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {lang === 'ar' ? 'محتويات الطلب' : 'Items'} ({order.items.length})
                    </div>
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span>{lang === 'ar' ? it.productNameAr : it.productNameEn}</span>
                        <span className="font-medium text-slate-500">
                          {it.quantity} {it.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer: Financial & Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {lang === 'ar' ? 'إجمالي الطلب مع التوصيل:' : 'Total with Delivery:'}
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {formatMoney(order.totalAmount, lang)}
                    </span>
                  </div>

                  {/* Assigned Driver or Driver Selector */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {order.assignedDriverName ? (
                      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{order.assignedDriverName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-1">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              dispatchDeliveryOrder(order.id, e.target.value);
                            }
                          }}
                          defaultValue=""
                          className="w-full text-xs font-bold bg-slate-100 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="" disabled>
                            {lang === 'ar' ? 'اختر المندوب للإسناد...' : 'Assign driver...'}
                          </option>
                          {drivers.filter((d) => d.active).map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Status progression button */}
                    {order.deliveryStatus === 'READY_FOR_DISPATCH' && order.assignedDriverId && (
                      <button
                        onClick={() => updateDeliveryStatus(order.id, 'DISPATCHED')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        {t.delivery.dispatchBtn}
                      </button>
                    )}

                    {isDispatched && (
                      <button
                        onClick={() => {
                          setCollectModalOrder(order);
                          setCollectedAmountInput(order.totalAmount.toString());
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        {t.delivery.markDelivered}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: New Delivery Order */}
      {newOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <span>{t.delivery.newOrder}</span>
              </h3>
              <button
                onClick={() => setNewOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="py-4 space-y-3">
              {/* Recipient details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.delivery.customer} *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: أ. محمود كامل"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.delivery.phone} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.delivery.address} *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="الشارع، رقم العمارة، رقم الشقة، علامة مميزة"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Delivery Zone Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.delivery.zone}
                </label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {deliveryZones.filter((z) => z.active).map((z) => (
                    <option key={z.id} value={z.id}>
                      {lang === 'ar' ? z.nameAr : z.nameEn} — {formatMoney(z.feeEgp, lang)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items in order */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === 'ar' ? 'المنتجات المطلوبة' : 'Order Products'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (products.length > 0) {
                        setOrderItems((prev) => [...prev, { productId: products[0].id, quantity: 1 }]);
                      }
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                  >
                    + {lang === 'ar' ? 'إضافة صنف' : 'Add Item'}
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const updated = [...orderItems];
                          updated[idx].productId = e.target.value;
                          setOrderItems(updated);
                        }}
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {lang === 'ar' ? p.nameAr : p.nameEn} ({formatMoney(p.sellingPrice, lang)}/{p.baseUnit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...orderItems];
                          updated[idx].quantity = parseFloat(e.target.value) || 1;
                          setOrderItems(updated);
                        }}
                        className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-center"
                      />

                      <button
                        type="button"
                        onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'تعليمات خاصة للطيار / المندوب' : 'Instructions'}
                </label>
                <input
                  type="text"
                  value={customerInstructions}
                  onChange={(e) => setCustomerInstructions(e.target.value)}
                  placeholder="مثال: رن الجرس ثلاث مرات أو اترك الطلب عند البواب"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                >
                  {lang === 'ar' ? 'إنشاء وتأكيد طلب التوصيل' : 'Create Delivery Order'}
                </button>
                <button
                  type="button"
                  onClick={() => setNewOrderModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  {t.common.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mark Delivered & Collection */}
      {collectModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{t.delivery.markDelivered}</span>
              </h3>
              <button
                onClick={() => setCollectModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم الطلب:</span>
                  <span className="font-bold text-slate-800">{collectModalOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المطلوب سداده:</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    {formatMoney(collectModalOrder.totalAmount, lang)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.delivery.collectedAmount} (ج.م)
                </label>
                <input
                  type="number"
                  value={collectedAmountInput}
                  onChange={(e) => setCollectedAmountInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const collected = parseFloat(collectedAmountInput) || 0;
                    updateDeliveryStatus(collectModalOrder.id, 'DELIVERED', {
                      collectedAmount: collected,
                    });
                    setCollectModalOrder(null);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                >
                  {t.common.confirm}
                </button>
                <button
                  onClick={() => {
                    // Mark delivered with 0 payment (Unpaid credit)
                    updateDeliveryStatus(collectModalOrder.id, 'DELIVERED', {
                      collectedAmount: 0,
                    });
                    setCollectModalOrder(null);
                  }}
                  className="px-3 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-xs cursor-pointer"
                >
                  {t.delivery.unpaidAllowed}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
