import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { Product, CartItem, SalePayment, SaleInvoice, PaymentMethod } from '../../types/index.ts';
import { TabId } from '../layout/Sidebar.tsx';
import { formatMoney, multiplyMoney, roundMoney, calculateInvoiceTotals } from '../../utils/accounting.ts';
import { calculateAvailableStock } from '../../utils/inventory.ts';
import { hardwareScale } from '../../utils/hardwareScale.ts';
import {
  Scale,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Banknote,
  Percent,
  X,
  User,
  ShoppingBag,
  Camera,
  Upload,
  Image as ImageIcon,
  Clock,
  Home,
  Settings as SettingsIcon,
  Receipt,
  Calculator,
  Search,
  Barcode,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface PosScreenProps {
  onNavigate?: (tab: TabId) => void;
}

export const PosScreen: React.FC<PosScreenProps> = ({ onNavigate }) => {
  const {
    lang,
    t,
    products,
    categories,
    stocks,
    customers,
    activeBranch,
    currentUser,
    salesInvoices,
    activeShift,
    createSale,
    updateProductImage,
  } = useStore();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-walkin');
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);

  // Live Digital Clock state
  const [currentTime, setCurrentTime] = useState<string>('06:00 PM');
  const [currentDate, setCurrentDate] = useState<string>('06/11/2026');

  // Live Scale State (simulating or connected via Web Serial RS-232/USB)
  const [liveScaleWeight, setLiveScaleWeight] = useState<number>(0.0);
  const [scaleTareActive, setScaleTareActive] = useState<boolean>(false);
  const [isPhysicalScaleConnected, setIsPhysicalScaleConnected] = useState<boolean>(false);

  // Listen to physical digital scale weight stream via Web Serial API
  useEffect(() => {
    const unsub = hardwareScale.onWeight((weight) => {
      setLiveScaleWeight(weight);
      setScaleTareActive(false);
    });
    return () => unsub();
  }, []);

  const handleConnectScale = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await hardwareScale.connect({ baudRate: 9600 });
    if (res.success) {
      setIsPhysicalScaleConnected(true);
      alert('✓ ' + res.message);
    } else {
      alert(res.message);
    }
  };

  // Initial Cart matching the user's reference image (130.00 EGP total with 5 produce items)
  const [cart, setCart] = useState<CartItem[]>(() => {
    return [
      {
        productId: 'prod-tomato',
        productNameAr: 'طماطم',
        productNameEn: 'Tomatoes',
        sku: 'VEG-001',
        barcode: '6221001',
        imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
        weightBased: true,
        unit: 'kg',
        quantity: 1.0,
        unitPrice: 15.0,
        purchaseCost: 11.0,
        discount: 0,
        total: 15.0,
      },
      {
        productId: 'prod-banana',
        productNameAr: 'موز',
        productNameEn: 'Bananas',
        sku: 'FRT-001',
        barcode: '6221011',
        imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
        weightBased: true,
        unit: 'kg',
        quantity: 1.0,
        unitPrice: 25.0,
        purchaseCost: 18.0,
        discount: 0,
        total: 25.0,
      },
      {
        productId: 'prod-redapple',
        productNameAr: 'تفاح أحمر',
        productNameEn: 'Red Apples',
        sku: 'FRT-002',
        barcode: '6221012',
        imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
        weightBased: true,
        unit: 'kg',
        quantity: 1.0,
        unitPrice: 30.0,
        purchaseCost: 22.0,
        discount: 0,
        total: 30.0,
      },
      {
        productId: 'prod-cucumber',
        productNameAr: 'خيار',
        productNameEn: 'Cucumbers',
        sku: 'VEG-004',
        barcode: '6221004',
        imageUrl: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=600&auto=format&fit=crop&q=80',
        weightBased: true,
        unit: 'kg',
        quantity: 0.75,
        unitPrice: 20.0,
        purchaseCost: 14.0,
        discount: 0,
        total: 15.0,
      },
      {
        productId: 'prod-strawberry-tray',
        productNameAr: 'طبق فراولة',
        productNameEn: 'Strawberry Tray',
        sku: 'TRY-001',
        barcode: '6222001',
        imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80',
        weightBased: false,
        unit: 'pack',
        quantity: 1.0,
        unitPrice: 45.0,
        purchaseCost: 32.0,
        discount: 0,
        total: 45.0,
      },
    ];
  });

  // Modals state
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [customWeightInput, setCustomWeightInput] = useState<string>('1.000');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receivedCashInput, setReceivedCashInput] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [receiptModalInvoice, setReceiptModalInvoice] = useState<SaleInvoice | null>(null);
  const [salesHistoryModalOpen, setSalesHistoryModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [posSettingsModalOpen, setPosSettingsModalOpen] = useState(false);

  // Produce Image Editor modal
  const [editingImageProduct, setEditingImageProduct] = useState<Product | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Live Digital Clock updating every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // Formatted Time (e.g. 06:00 PM)
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
      setCurrentTime(`${formattedHours}:${minutes} ${ampm}`);

      // Formatted Date (e.g. 06/11/2026)
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      setCurrentDate(`${day}/${month}/${year}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle product click
  const onProductSelect = (product: Product) => {
    if (product.weightBased) {
      // If live scale has active weight, use it directly!
      if (liveScaleWeight > 0.005) {
        addToCartWithQuantity(product, liveScaleWeight);
      } else {
        setWeightModalProduct(product);
        setCustomWeightInput('1.000');
      }
    } else {
      addToCartWithQuantity(product, 1);
    }
  };

  // Add to cart helper
  const addToCartWithQuantity = (product: Product, qty: number) => {
    const roundedQty = roundMoney(qty);
    if (roundedQty <= 0) return;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.productId === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = roundMoney(updated[existingIndex].quantity + roundedQty);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          total: roundMoney(newQty * updated[existingIndex].unitPrice - updated[existingIndex].discount),
        };
        return updated;
      } else {
        const itemTotal = roundMoney(roundedQty * product.sellingPrice);
        const newItem: CartItem = {
          productId: product.id,
          productNameAr: product.nameAr,
          productNameEn: product.nameEn,
          sku: product.sku,
          barcode: product.barcode,
          imageUrl: product.imageUrl,
          weightBased: product.weightBased,
          unit: product.baseUnit,
          quantity: roundedQty,
          unitPrice: product.sellingPrice,
          purchaseCost: product.purchaseCost,
          discount: 0,
          total: itemTotal,
        };
        return [...prevCart, newItem];
      }
    });
  };

  // Stepper increment/decrement
  const updateItemQty = (productId: string, newQty: number) => {
    if (newQty <= 0.001) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: roundMoney(newQty),
              total: roundMoney(newQty * item.unitPrice - item.discount),
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Cart totals calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const { subtotal, discount, total: grandTotal } = calculateInvoiceTotals({
    subtotal: cartSubtotal,
    discount: invoiceDiscount,
    deliveryFee: 0,
  });

  // Open Checkout Modal
  const openCheckout = () => {
    if (cart.length === 0) return;
    setReceivedCashInput(grandTotal.toFixed(2));
    setPaymentModalOpen(true);
  };

  // Complete fast checkout
  const handleCompleteSale = () => {
    const customer = customers.find((c) => c.id === selectedCustomerId);
    const received = parseFloat(receivedCashInput) || grandTotal;
    const isCredit = selectedPaymentMethod === 'customer_credit';

    const paid = isCredit ? 0 : Math.min(grandTotal, received);
    const change = isCredit ? 0 : Math.max(0, roundMoney(received - grandTotal));
    const credit = isCredit ? grandTotal : Math.max(0, roundMoney(grandTotal - received));

    const payments: SalePayment[] = isCredit
      ? []
      : [
          {
            id: `pay-${Date.now()}`,
            method: selectedPaymentMethod,
            amount: paid,
            timestamp: new Date().toISOString(),
          },
        ];

    const invoice = createSale({
      items: cart,
      customerId: customer?.id,
      customerName: customer ? customer.name : t.pos.walkInCustomer,
      subtotal,
      discount,
      total: grandTotal,
      payments,
      paidAmount: paid,
      changeAmount: change,
      remainingCredit: credit,
    });

    // Reset cart
    setCart([]);
    setInvoiceDiscount(0);
    setPaymentModalOpen(false);

    // Show thermal receipt
    setReceiptModalInvoice(invoice);
  };

  // Scale simulation helper
  const toggleScaleSimulation = () => {
    if (liveScaleWeight > 0) {
      setLiveScaleWeight(0.0);
      setScaleTareActive(false);
    } else {
      // Simulate random weight between 0.350kg and 2.150kg
      const simulated = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0][Math.floor(Math.random() * 6)];
      setLiveScaleWeight(simulated);
      setScaleTareActive(false);
    }
  };

  const handleScaleTare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiveScaleWeight(0.0);
    setScaleTareActive(true);
  };

  // 5 Category Tiles Definitions matching screenshot
  const categoryTiles = [
    {
      id: 'cat-veg',
      nameAr: 'خضار',
      nameEn: 'Vegetables',
      bgClass: 'bg-gradient-to-b from-[#ff8c00] via-[#ff6f00] to-[#e65100]',
      activeBorder: 'ring-4 ring-orange-300',
      iconEmoji: '🥕',
      iconUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: 'cat-fruits',
      nameAr: 'فاكهة',
      nameEn: 'Fruits',
      bgClass: 'bg-gradient-to-b from-[#0d47a1] via-[#1565c0] to-[#0a3880]',
      activeBorder: 'ring-4 ring-blue-300',
      iconEmoji: '🍎',
      iconUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: 'cat-herbs',
      nameAr: 'ورقيات',
      nameEn: 'Herbs & Leafy',
      bgClass: 'bg-gradient-to-b from-[#1b5e20] via-[#2e7d32] to-[#144717]',
      activeBorder: 'ring-4 ring-green-300',
      iconEmoji: '🌿',
      iconUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: 'cat-staples',
      nameAr: 'أصناف أخرى',
      nameEn: 'Other / Grocery',
      bgClass: 'bg-gradient-to-b from-[#4a148c] via-[#6a1b9a] to-[#38006b]',
      activeBorder: 'ring-4 ring-purple-300',
      iconEmoji: '📦',
      iconUrl: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: 'cat-prepackaged',
      nameAr: 'أطباق جاهزة',
      nameEn: 'Ready Trays',
      bgClass: 'bg-gradient-to-b from-[#00838f] via-[#0097a7] to-[#006064]',
      activeBorder: 'ring-4 ring-cyan-300',
      iconEmoji: '🍱',
      iconUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=100&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0d1b3e] text-slate-100 select-none font-sans">
      {/* 1. TOP HEADER BAR matching reference image */}
      <header className="h-16 bg-[#0c1836] border-b border-[#1b2d5a] px-4 flex items-center justify-between shrink-0 shadow-md">
        {/* Brand Side: Logo + Divider + Shop Name */}
        <div className="flex items-center gap-3">
          {/* Talabeyah Brand Logo */}
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-900/30">
              <ShoppingBag className="w-5 h-5 text-slate-900" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-xs">
                <span className="text-[10px] leading-none text-white">🌱</span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-xl tracking-tight text-white font-sans">Talabeyah</span>
                <span className="font-black text-lg text-amber-400">طلبية</span>
              </div>
            </div>
          </div>

          {/* Thin White Vertical Divider */}
          <div className="h-8 w-px bg-slate-500/60 mx-1" />

          {/* Shop Title & Slogan */}
          <div className="flex flex-col justify-center">
            <h1 className="text-lg font-black text-white leading-tight">
              {lang === 'ar' ? 'محل خضار وفواكه' : 'Fresh Produce & Fruits Market'}
            </h1>
            <p className="text-xs text-sky-200/80 font-medium leading-none mt-0.5">
              {lang === 'ar' ? 'جودة .. أسعار مناسبة' : 'Quality .. Affordable Prices'}
            </p>
          </div>
        </div>

        {/* Center / Right Side: Live Clock, Cashier Badge, Home Button */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Live Digital Clock */}
          <div className="flex items-center gap-2.5 bg-[#122452] border border-[#1e3a7a] px-3 py-1.5 rounded-xl shadow-inner">
            <Clock className="w-6 h-6 text-sky-300 shrink-0" />
            <div className="flex flex-col text-start font-mono leading-none">
              <span className="text-sm font-extrabold text-white tracking-wider">{currentTime}</span>
              <span className="text-[11px] text-sky-300 font-semibold mt-0.5">{currentDate}</span>
            </div>
          </div>

          {/* Active Cashier Badge */}
          <div className="flex items-center gap-2.5 bg-[#122452] border border-[#1e3a7a] px-3.5 py-1.5 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-start leading-none">
              <span className="text-sm font-bold text-white">
                {currentUser?.name?.split(' ')[0] || 'أحمد'}
              </span>
              <span className="text-[11px] text-sky-300 font-medium mt-0.5">
                {lang === 'ar' ? 'كاشير' : 'Cashier'}
              </span>
            </div>
          </div>

          {/* Shift Status Badge & Link */}
          <button
            type="button"
            onClick={() => onNavigate?.('shifts')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm ${
              activeShift
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/80'
                : 'bg-amber-950/70 border-amber-500/60 text-amber-300 hover:bg-amber-900/80'
            }`}
            title="إدارة الوردية والدرج النقدي"
          >
            <Clock className="w-4 h-4" />
            <div className="flex flex-col text-start leading-tight">
              <span>{activeShift ? `وردية #${activeShift.id.slice(-4)}` : 'فتح وردية'}</span>
              <span className="text-[10px] font-mono opacity-80">
                {activeShift ? `${activeShift.expectedCash.toFixed(2)} ج.م` : 'مغلقة'}
              </span>
            </div>
          </button>

          {/* Home / Backoffice Toggle Button */}
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="flex flex-col items-center justify-center px-3.5 py-1.5 bg-[#152e69] hover:bg-[#1b3d8f] text-white rounded-xl transition-colors cursor-pointer border border-[#23499e] shadow-sm active:scale-95"
            title={lang === 'ar' ? 'الانتقال إلى لوحة الإدارة والمخازن والحسابات' : 'Go to Backoffice Dashboard'}
          >
            <Home className="w-5 h-5 text-sky-200" />
            <span className="text-[11px] font-bold text-white mt-0.5">
              {lang === 'ar' ? 'الرئيسية' : 'Home'}
            </span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE: LEFT RECEIPT CART + RIGHT PRODUCT CATALOG */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: 6-Column Receipt Table & Cart Totals */}
        <div className="w-[420px] xl:w-[460px] bg-[#0c1836] border-e border-[#1c2e5b] flex flex-col justify-between shrink-0 shadow-2xl">
          {/* Table Header: م | الصنف | الكمية | السعر | الإجمالي | X */}
          <div className="bg-[#122b68] border-b border-[#214294] text-white text-xs font-black grid grid-cols-12 py-2.5 px-3 items-center text-center select-none shadow-xs">
            <div className="col-span-1 text-slate-300">م</div>
            <div className="col-span-4 text-start ps-2">الصنف</div>
            <div className="col-span-3">الكمية</div>
            <div className="col-span-2">السعر</div>
            <div className="col-span-1">الإجمالي</div>
            <div className="col-span-1 text-center">حذف</div>
          </div>

          {/* Cart Table Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/80 bg-white text-slate-900">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <ShoppingBag className="w-16 h-16 stroke-1 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-600 mb-1">
                  {lang === 'ar' ? 'السلة فارغة' : 'Cart is Empty'}
                </p>
                <p className="text-xs text-slate-400 max-w-[220px]">
                  {lang === 'ar'
                    ? 'اضغط على الأصناف في القائمة لإضافتها إلى الفاتورة'
                    : 'Tap items on the catalog grid to add them'}
                </p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div
                  key={item.productId}
                  className={`grid grid-cols-12 items-center py-2 px-2 text-xs transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'
                  } hover:bg-amber-50/50`}
                >
                  {/* Column 1: Row Index (م) */}
                  <div className="col-span-1 text-center font-bold text-slate-600">
                    {index + 1}
                  </div>

                  {/* Column 2: Produce Thumbnail + Arabic Name */}
                  <div className="col-span-4 flex items-center gap-2 ps-1 min-w-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-white border border-slate-200 shrink-0 shadow-xs">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100&auto=format&fit=crop&q=80'}
                        alt={item.productNameAr}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-slate-900 truncate text-[13px] leading-tight">
                        {lang === 'ar' ? item.productNameAr : item.productNameEn}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {item.weightBased ? 'بالوزن' : 'بالقطعة'}
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Stepper [-] qty [+] */}
                  <div className="col-span-3 flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateItemQty(
                          item.productId,
                          item.quantity - (item.weightBased ? 0.25 : 1)
                        )
                      }
                      className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-black text-slate-900 text-xs min-w-[38px] text-center">
                      {item.quantity.toFixed(item.weightBased ? 3 : 2)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateItemQty(
                          item.productId,
                          item.quantity + (item.weightBased ? 0.25 : 1)
                        )
                      }
                      className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Column 4: Unit Price */}
                  <div className="col-span-2 text-center font-mono font-bold text-slate-700 text-xs">
                    {item.unitPrice.toFixed(2)}
                  </div>

                  {/* Column 5: Line Total */}
                  <div className="col-span-1 text-center font-mono font-black text-slate-950 text-xs">
                    {item.total.toFixed(2)}
                  </div>

                  {/* Column 6: Delete Red Button */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      className="w-6 h-6 rounded bg-red-600 hover:bg-red-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs transition-colors"
                      title={lang === 'ar' ? 'حذف الصنف' : 'Remove Item'}
                    >
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CART TOTALS & SUMMARY SECTION */}
          <div className="bg-[#0e1d42] border-t border-[#1e346b] p-3 space-y-2">
            {/* Row 1: عدد الأصناف */}
            <div className="bg-[#122452] rounded-lg px-3 py-2 flex items-center justify-between text-white text-xs">
              <span className="font-mono font-black text-base text-white">{cart.length}</span>
              <div className="flex items-center gap-1.5 font-bold text-sky-200">
                <span>{lang === 'ar' ? 'عدد الأصناف' : 'Items Count'}</span>
                <ShoppingBag className="w-4 h-4 text-sky-300" />
              </div>
            </div>

            {/* Row 2: الخصم */}
            <div
              onClick={() => setDiscountModalOpen(true)}
              className="bg-[#122452] hover:bg-[#162c66] transition-colors rounded-lg px-3 py-2 flex items-center justify-between text-white text-xs cursor-pointer border border-transparent hover:border-sky-500/50"
              title={lang === 'ar' ? 'تعديل الخصم' : 'Edit Discount'}
            >
              <span className="font-mono font-black text-base text-white">
                {discount.toFixed(2)}
              </span>
              <div className="flex items-center gap-1.5 font-bold text-sky-200">
                <span>{lang === 'ar' ? 'الخصم' : 'Discount'}</span>
                <Percent className="w-4 h-4 text-sky-300" />
              </div>
            </div>

            {/* Row 3: GIANT GLOWING YELLOW ON NAVY BLUE TOTAL CARD matching screenshot */}
            <div className="bg-[#0a1838] border-2 border-[#1f3f87] rounded-xl p-3 flex items-center justify-between shadow-xl">
              <span className="font-mono font-black text-3xl sm:text-4xl text-yellow-300 tracking-tight drop-shadow-md">
                {grandTotal.toFixed(2)}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white">
                  {lang === 'ar' ? 'الإجمالي' : 'Total'}
                </span>
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-black text-base shadow-md">
                  $
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: CATEGORY TILES + 5-COLUMN PRODUCE GRID */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1b3e] p-3 space-y-3">
          {/* TOP ROW: 5 VIBRANT TOUCH CATEGORY TILES matching screenshot */}
          <div className="grid grid-cols-5 gap-3 shrink-0">
            {categoryTiles.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                  className={`h-24 sm:h-28 rounded-2xl p-2 flex flex-col items-center justify-between shadow-lg cursor-pointer transition-all active:scale-95 ${cat.bgClass} ${
                    isSelected ? 'ring-4 ring-yellow-400 scale-[1.02]' : 'hover:brightness-110'
                  }`}
                >
                  {/* Category Illustration / Icon */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner overflow-hidden p-1">
                    <span className="text-2xl sm:text-3xl">{cat.iconEmoji}</span>
                  </div>

                  {/* Category Title */}
                  <span className="text-sm sm:text-base font-black text-white text-center leading-none drop-shadow-sm">
                    {lang === 'ar' ? cat.nameAr : cat.nameEn}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 5-COLUMN PRODUCE GRID (NO NESTED BUTTONS!) */}
          <div className="flex-1 overflow-y-auto pe-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((p) => {
                const availStock = stocks
                  .filter((s) => s.productId === p.id && s.branchId === activeBranch.id)
                  .reduce((acc, s) => acc + calculateAvailableStock(s), 0);

                return (
                  <div
                    key={p.id}
                    onClick={() => onProductSelect(p)}
                    className="group bg-white rounded-2xl border-2 border-slate-200/90 hover:border-sky-500 hover:shadow-xl p-2.5 flex flex-col justify-between items-center text-center cursor-pointer transition-all active:scale-[0.98] relative min-h-[160px] sm:min-h-[180px]"
                  >
                    {/* Produce Photo */}
                    <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center relative">
                      <img
                        src={p.imageUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80'}
                        alt={p.nameAr}
                        className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Weight based indicator badge */}
                      {p.weightBased && (
                        <div className="absolute top-1 start-1 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          {t.pos.unitKg}
                        </div>
                      )}

                      {/* Photo change trigger without role=button */}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingImageProduct(p);
                          setImageUrlInput(p.imageUrl || '');
                        }}
                        title={lang === 'ar' ? 'تعديل أو تغيير صورة الصنف' : 'Change Produce Photo'}
                        className="absolute top-1 end-1 p-1 rounded-md bg-white/90 hover:bg-white text-slate-700 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-700" />
                      </span>
                    </div>

                    {/* Produce Name */}
                    <div className="w-full mt-2">
                      <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">
                        {lang === 'ar' ? p.nameAr : p.nameEn}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mt-1">
                        <span className="font-mono text-emerald-700 text-xs sm:text-sm font-black">
                          {p.sellingPrice.toFixed(2)} {t.currency}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          /{p.baseUnit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ACTION DOCK matching reference image */}
      <footer className="h-18 bg-[#0a1532] border-t border-[#182a55] px-3 py-2 flex items-center justify-between gap-2 shrink-0 shadow-2xl">
        {/* Button 1: إعدادات (Settings) */}
        <button
          type="button"
          onClick={() => setPosSettingsModalOpen(true)}
          className="h-full px-4 rounded-xl bg-[#0f2452] hover:bg-[#153474] text-white flex flex-col items-center justify-center gap-1 border border-[#1b3b80] cursor-pointer transition-colors active:scale-95 shadow-sm"
        >
          <SettingsIcon className="w-5 h-5 text-sky-200" />
          <span className="text-xs font-bold leading-none">{lang === 'ar' ? 'إعدادات' : 'Settings'}</span>
        </button>

        {/* Button 2: طباعة الفاتورة (Print Invoice) */}
        <button
          type="button"
          onClick={() => {
            const lastInvoice = salesInvoices[salesInvoices.length - 1];
            if (lastInvoice) {
              setReceiptModalInvoice(lastInvoice);
            } else {
              alert(lang === 'ar' ? 'لا توجد فواتير سابقة للطباعة' : 'No previous invoices to print');
            }
          }}
          className="h-full px-4 rounded-xl bg-[#0f2452] hover:bg-[#153474] text-white flex flex-col items-center justify-center gap-1 border border-[#1b3b80] cursor-pointer transition-colors active:scale-95 shadow-sm"
        >
          <Printer className="w-5 h-5 text-sky-200" />
          <span className="text-xs font-bold leading-none">{lang === 'ar' ? 'طباعة الفاتورة' : 'Print Invoice'}</span>
        </button>

        {/* Button 3: المبيعات (Sales Ledger) */}
        <button
          type="button"
          onClick={() => setSalesHistoryModalOpen(true)}
          className="h-full px-4 rounded-xl bg-[#0f2452] hover:bg-[#153474] text-white flex flex-col items-center justify-center gap-1 border border-[#1b3b80] cursor-pointer transition-colors active:scale-95 shadow-sm"
        >
          <Receipt className="w-5 h-5 text-sky-200" />
          <span className="text-xs font-bold leading-none">{lang === 'ar' ? 'المبيعات' : 'Sales'}</span>
        </button>

        {/* Button 4: الوزن من الميزان (Digital Scale Box with LED readout) */}
        <div
          onClick={toggleScaleSimulation}
          className="h-full px-4 rounded-xl bg-[#09142b] border-2 border-emerald-500/70 hover:border-emerald-400 flex items-center justify-between gap-3 text-white cursor-pointer select-none shadow-inner group min-w-[230px]"
          title={lang === 'ar' ? 'اضغط لمحاكاة الوزن، أو اضغط على (ربط USB) لتوصيل ميزان إلكتروني حقيقي' : 'Click to simulate, or click (Connect USB) for physical scale'}
        >
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
              isPhysicalScaleConnected
                ? 'bg-emerald-600 border-emerald-300 text-white animate-pulse'
                : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
            }`}>
              <Scale className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-start">
              <span className="text-[11px] font-bold text-sky-200 leading-tight">
                {lang === 'ar' ? 'الوزن من الميزان' : 'Scale Weight'}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  onClick={handleScaleTare}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-extrabold cursor-pointer"
                >
                  {scaleTareActive ? 'تم التصفير' : 'تصفير (Tare)'}
                </span>
                <span className="text-slate-600">•</span>
                <span
                  onClick={handleConnectScale}
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded transition ${
                    isPhysicalScaleConnected
                      ? 'bg-emerald-500/30 text-emerald-300'
                      : 'bg-indigo-900/60 text-indigo-300 hover:bg-indigo-800'
                  }`}
                  title="ربط ميزان إلكتروني حقيقي عبر منفذ USB/Serial"
                >
                  {isPhysicalScaleConnected ? 'متصل ✓' : 'ربط USB'}
                </span>
              </div>
            </div>
          </div>

          <div className="font-mono font-black text-xl sm:text-2xl text-emerald-400 tracking-wider">
            {liveScaleWeight.toFixed(3)} <span className="text-xs text-emerald-300">kg</span>
          </div>
        </div>

        {/* Button 5: إضافة بالوزن (Add by Weight) */}
        <button
          type="button"
          onClick={() => {
            const firstWeightItem = products.find((p) => p.weightBased) || products[0];
            setWeightModalProduct(firstWeightItem);
            setCustomWeightInput('1.000');
          }}
          className="h-full px-4 rounded-xl bg-gradient-to-b from-purple-700 to-purple-900 hover:brightness-110 text-white flex flex-col items-center justify-center gap-1 border border-purple-500/50 cursor-pointer transition-all active:scale-95 shadow-sm"
        >
          <Calculator className="w-5 h-5 text-purple-200" />
          <span className="text-xs font-bold leading-none">{lang === 'ar' ? 'إضافة بالوزن' : 'Add by Weight'}</span>
        </button>

        {/* Button 6: حذف الكل (Clear Cart) */}
        <button
          type="button"
          onClick={() => {
            if (cart.length > 0) {
              setCart([]);
            }
          }}
          className="h-full px-4 rounded-xl bg-gradient-to-b from-red-600 to-red-800 hover:brightness-110 text-white flex flex-col items-center justify-center gap-1 border border-red-500/50 cursor-pointer transition-all active:scale-95 shadow-sm"
        >
          <Trash2 className="w-5 h-5 text-red-200" />
          <span className="text-xs font-bold leading-none">{lang === 'ar' ? 'حذف الكل' : 'Clear All'}</span>
        </button>

        {/* Button 7: خصم (Discount) */}
        <button
          type="button"
          onClick={() => setDiscountModalOpen(true)}
          className="h-full px-4 rounded-xl bg-gradient-to-b from-amber-500 to-amber-700 hover:brightness-110 text-white flex flex-col items-center justify-center gap-1 border border-amber-400/50 cursor-pointer transition-all active:scale-95 shadow-sm"
        >
          <Percent className="w-5 h-5 text-amber-200" />
          <span className="text-xs font-bold leading-none">{lang === 'ar' ? 'خصم' : 'Discount'}</span>
        </button>

        {/* Button 8: GIANT GLOWING EMERALD GREEN BUTTON: دفع الفاتورة (Pay Invoice) */}
        <button
          type="button"
          onClick={openCheckout}
          disabled={cart.length === 0}
          className={`h-full flex-1 max-w-[280px] rounded-xl flex items-center justify-center gap-3 text-white font-black text-lg sm:text-xl transition-all shadow-xl active:scale-95 cursor-pointer ${
            cart.length === 0
              ? 'bg-slate-700 opacity-60 cursor-not-allowed text-slate-400 border border-slate-600'
              : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 hover:brightness-110 border-2 border-emerald-300 shadow-emerald-900/50'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <span>{lang === 'ar' ? 'دفع الفاتورة' : 'Pay Invoice'}</span>
        </button>
      </footer>

      {/* MODAL 1: FAST CHECKOUT & PAYMENT MODAL */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    {lang === 'ar' ? 'دفع الفاتورة وسداد الحساب' : 'Checkout & Payment'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'ar' ? 'اختر طريقة السداد واستلم المبلغ' : 'Select payment method and collect cash'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Grand Total Display */}
              <div className="bg-[#0b193d] text-white p-4 rounded-2xl flex items-center justify-between shadow-inner">
                <span className="text-sm text-sky-200 font-bold">{lang === 'ar' ? 'المبلغ المطلوب:' : 'Amount Due:'}</span>
                <span className="text-3xl font-mono font-black text-yellow-300">
                  {grandTotal.toFixed(2)} {t.currency}
                </span>
              </div>

              {/* Customer Selector (Walk-in vs Account) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'العميل:' : 'Customer:'}
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.outstandingBalance > 0 ? `(آجل: ${c.outstandingBalance.toFixed(2)} ج.م)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Methods Grid */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'cash' as PaymentMethod, label: 'كاش / نقد', icon: Banknote },
                  { id: 'bank_card' as PaymentMethod, label: 'فيزا / كارت', icon: CreditCard },
                  { id: 'instapay' as PaymentMethod, label: 'إنستاباي', icon: Smartphone },
                  { id: 'customer_credit' as PaymentMethod, label: 'حساب آجل (شكك)', icon: User },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = selectedPaymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(pm.id)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="leading-tight">{pm.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cash Tender & Change Calculation */}
              {selectedPaymentMethod === 'cash' && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      {lang === 'ar' ? 'المبلغ المستلم من العميل:' : 'Cash Received:'}
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={receivedCashInput}
                      onChange={(e) => setReceivedCashInput(e.target.value)}
                      className="w-32 text-end font-mono font-black text-xl bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Cash Presets */}
                  <div className="flex gap-2">
                    {[50, 100, 200, 500].map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => setReceivedCashInput(bill.toString())}
                        className="flex-1 py-1.5 bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-slate-300 font-bold text-xs text-slate-700 rounded-lg cursor-pointer transition-colors"
                      >
                        +{bill}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculation */}
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span>{lang === 'ar' ? 'المتبقي (الفكة للعميل):' : 'Change Due:'}</span>
                    <span className="text-lg font-mono font-black text-emerald-800">
                      {Math.max(0, roundMoney((parseFloat(receivedCashInput) || 0) - grandTotal)).toFixed(2)} {t.currency}
                    </span>
                  </div>
                </div>
              )}

              {/* Confirm & Complete Sale Button */}
              <button
                type="button"
                onClick={handleCompleteSale}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-base transition-colors cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{lang === 'ar' ? 'تأكيد البيع وحفظ الفاتورة' : 'Confirm Sale & Print'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DECIMAL WEIGHT KEYPAD MODAL */}
      {weightModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">
                  {lang === 'ar' ? weightModalProduct.nameAr : weightModalProduct.nameEn}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWeightModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4">
              <div className="text-center mb-4">
                <div className="text-xs text-slate-500 font-bold mb-1">
                  {weightModalProduct.sellingPrice.toFixed(2)} {t.currency} / {weightModalProduct.baseUnit}
                </div>
                <div className="relative inline-block w-48">
                  <input
                    type="number"
                    step="0.005"
                    value={customWeightInput}
                    onChange={(e) => setCustomWeightInput(e.target.value)}
                    className="text-center font-mono font-black text-3xl text-emerald-700 bg-emerald-50 border-2 border-emerald-300 rounded-2xl py-2 w-full focus:outline-none"
                    autoFocus
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-800">
                    {t.pos.unitKg}
                  </span>
                </div>
              </div>

              {/* Weight Presets */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setCustomWeightInput(w.toFixed(3))}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 font-bold text-xs text-slate-700 transition-colors cursor-pointer"
                  >
                    {w} {t.pos.unitKg}
                  </button>
                ))}
              </div>

              {/* Read live scale weight */}
              {liveScaleWeight > 0 && (
                <button
                  type="button"
                  onClick={() => setCustomWeightInput(liveScaleWeight.toFixed(3))}
                  className="w-full mb-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Scale className="w-4 h-4 text-emerald-700" />
                  <span>استخدام قراءة الميزان الحالية ({liveScaleWeight.toFixed(3)} كجم)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const weightVal = parseFloat(customWeightInput) || 1.0;
                  addToCartWithQuantity(weightModalProduct, weightVal);
                  setWeightModalProduct(null);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-sm transition-colors cursor-pointer shadow-md"
              >
                {t.common.confirm} - {(multiplyMoney(parseFloat(customWeightInput) || 1.0, weightModalProduct.sellingPrice)).toFixed(2)} {t.currency}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK DISCOUNT MODAL */}
      {discountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-500" />
                <span>{lang === 'ar' ? 'خصم الفاتورة' : 'Invoice Discount'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setDiscountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'مبلغ الخصم المباشر (ج.م):' : 'Discount Amount (EGP):'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={invoiceDiscount || ''}
                  onChange={(e) => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full text-center font-mono font-black text-2xl bg-slate-50 border border-slate-300 rounded-xl py-2 text-red-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              {/* Discount Presets */}
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setInvoiceDiscount(val)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-800 font-bold text-xs text-slate-700 transition-colors cursor-pointer"
                  >
                    {val} ج.م
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceDiscount(0);
                    setDiscountModalOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء الخصم' : 'Clear Discount'}
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountModalOpen(false)}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  {lang === 'ar' ? 'تطبيق الخصم' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SALES INVOICES HISTORY MODAL */}
      {salesHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-sky-600" />
                <h3 className="font-black text-slate-900 text-base">
                  {lang === 'ar' ? 'سجل فواتير المبيعات السابقة' : 'Sales Invoices Log'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSalesHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {salesInvoices.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  {lang === 'ar' ? 'لا توجد فواتير مبيعات مسجلة بعد' : 'No sales invoices recorded yet'}
                </div>
              ) : (
                [...salesInvoices].reverse().map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-black text-xs text-slate-900 flex items-center gap-2">
                        <span>فاتورة: {inv.invoiceNumber}</span>
                        <span className="text-[10px] font-normal text-slate-500">
                          {new Date(inv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {inv.customerName} • {inv.items.length} أصناف
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-emerald-700 text-sm">
                        {inv.total.toFixed(2)} {t.currency}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptModalInvoice(inv);
                          setSalesHistoryModalOpen(false);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'طباعة' : 'Print'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setSalesHistoryModalOpen(false);
                  onNavigate?.('invoices');
                }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
              >
                <Receipt className="w-4 h-4" />
                <span>فتح السجل الشامل للفواتير والمرتجعات والردود</span>
              </button>
              <button
                type="button"
                onClick={() => setSalesHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: QUICK POS SETTINGS MODAL */}
      {posSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-slate-700" />
                <span>{lang === 'ar' ? 'إعدادات نقطة البيع السريعة' : 'Quick POS Settings'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPosSettingsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold">
                <span>{lang === 'ar' ? 'طباعة إيصال تلقائي عند الدفع:' : 'Auto Print on Payment:'}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600 cursor-pointer" />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold">
                <span>{lang === 'ar' ? 'صوت التنبيه عند قراءة الباركود:' : 'Barcode Beep Sound:'}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600 cursor-pointer" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setPosSettingsModalOpen(false);
                  onNavigate?.('settings');
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{lang === 'ar' ? 'الانتقال إلى الإعدادات الشاملة للمنصة' : 'Open Full SaaS Settings'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: THERMAL RECEIPT PREVIEW & PRINT */}
      {receiptModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تم إصدار الفاتورة بنجاح' : 'Receipt Ready'}</span>
              </span>
              <button
                type="button"
                onClick={() => setReceiptModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Thermal Receipt Area */}
            <div
              id="thermal-receipt-print"
              className="flex-1 overflow-y-auto my-3 p-4 bg-white border border-dashed border-slate-300 font-mono text-xs text-slate-900 leading-tight space-y-2 select-text"
            >
              {/* Header */}
              <div className="text-center space-y-0.5">
                <div className="font-black text-base">{t.appName}</div>
                <div>{lang === 'ar' ? activeBranch.nameAr : activeBranch.nameEn}</div>
                <div className="text-[10px] text-slate-500">{activeBranch.address}</div>
                <div className="text-[10px] text-slate-500">هاتف: {activeBranch.phone}</div>
                <div className="border-b border-dashed border-slate-400 my-1"></div>
              </div>

              {/* Invoice Meta */}
              <div className="text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span>فاتورة: {receiptModalInvoice.invoiceNumber}</span>
                  <span>
                    {new Date(receiptModalInvoice.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>الكاشير: {receiptModalInvoice.cashierName}</span>
                  <span>{receiptModalInvoice.customerName}</span>
                </div>
                <div className="border-b border-dashed border-slate-400 my-1"></div>
              </div>

              {/* Items List */}
              <div className="space-y-1">
                {receiptModalInvoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="flex-1 pe-2">
                      <div>{item.productNameAr}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.quantity} {item.unit} × {item.unitPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="font-bold">{item.total.toFixed(2)}</div>
                  </div>
                ))}
                <div className="border-b border-dashed border-slate-400 my-1"></div>
              </div>

              {/* Totals */}
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>المجموع:</span>
                  <span>{receiptModalInvoice.subtotal.toFixed(2)} ج.م</span>
                </div>
                {receiptModalInvoice.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>الخصم:</span>
                    <span>-{receiptModalInvoice.discount.toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                  <span>الإجمالي:</span>
                  <span>{receiptModalInvoice.total.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span>المدفوع:</span>
                  <span>{receiptModalInvoice.paidAmount.toFixed(2)} ج.م</span>
                </div>
                {receiptModalInvoice.changeAmount > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span>المتبقي (الفكة):</span>
                    <span>{receiptModalInvoice.changeAmount.toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="border-b border-dashed border-slate-400 my-1"></div>
              </div>

              {/* Footer */}
              <div className="text-center text-[10px] text-slate-500 pt-1 space-y-0.5">
                <div>شكراً لزيارتكم ونتمنى لكم يوماً سعيداً!</div>
                <div>المرتجع خلال 24 ساعة بموجب الفاتورة</div>
                <div className="font-bold tracking-widest text-[9px] pt-1">
                  * {receiptModalInvoice.invoiceNumber} *
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>{t.pos.printReceipt}</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptModalInvoice(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: PRODUCE PHOTO MANAGER */}
      {editingImageProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <span>{lang === 'ar' ? 'تعديل صورة المنتج' : 'Change Product Photo'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingImageProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="w-full h-36 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
                {imageUrlInput ? (
                  <img src={imageUrlInput} alt="Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-xs text-slate-400">لا توجد صورة</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'رابط الصورة (URL):' : 'Image URL:'}
                </label>
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setImageUrlInput('')}
                  className="text-xs text-red-600 font-bold cursor-pointer"
                >
                  {lang === 'ar' ? 'حذف الصورة' : 'Remove Image'}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingImageProduct(null)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingImageProduct) {
                        updateProductImage(editingImageProduct.id, imageUrlInput);
                        setEditingImageProduct(null);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                  >
                    {lang === 'ar' ? 'حفظ الصورة' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
