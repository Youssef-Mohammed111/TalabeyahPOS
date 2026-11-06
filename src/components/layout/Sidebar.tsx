import React from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { calculateAvailableStock } from '../../utils/inventory.ts';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Bike,
  Coins,
  Package,
  ArrowDownLeft,
  DollarSign,
  BarChart3,
  Users,
  Settings,
  Database,
  AlertTriangle,
  Clock,
  Receipt,
  TrendingUp,
  Trash2,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

export type TabId =
  | 'dashboard'
  | 'pos'
  | 'shifts'
  | 'invoices'
  | 'today_prices'
  | 'customers'
  | 'waste_audit'
  | 'delivery'
  | 'driver_portal'
  | 'driver_custody'
  | 'inventory'
  | 'purchasing'
  | 'cashbox'
  | 'reports'
  | 'audit_log'
  | 'users'
  | 'settings'
  | 'backup';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen = false,
  setMobileOpen,
}) => {
  const { t, deliveryOrders, stocks, products, activeBranch, currentUser } = useStore();

  // Active delivery count
  const activeDeliveriesCount = deliveryOrders.filter(
    (o) =>
      o.branchId === activeBranch.id &&
      (o.deliveryStatus === 'READY_FOR_DISPATCH' ||
        o.deliveryStatus === 'ASSIGNED' ||
        o.deliveryStatus === 'DISPATCHED' ||
        o.deliveryStatus === 'ON_THE_WAY')
  ).length;

  // Low stock items count
  const lowStockCount = products.filter((p) => {
    const stock = stocks.find((s) => s.productId === p.id && s.branchId === activeBranch.id);
    if (!stock) return false;
    const available = calculateAvailableStock(stock);
    return available <= p.minStock;
  }).length;

  const navItems = [
    {
      id: 'pos' as TabId,
      label: t.nav.pos,
      icon: ShoppingCart,
      highlight: true,
      badge: null,
    },
    {
      id: 'shifts' as TabId,
      label: t.nav.shifts,
      icon: Clock,
      badge: null,
    },
    {
      id: 'invoices' as TabId,
      label: t.nav.invoices,
      icon: Receipt,
      badge: null,
    },
    {
      id: 'today_prices' as TabId,
      label: t.nav.todayPrices,
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'customers' as TabId,
      label: t.nav.customers,
      icon: UserCheck,
      badge: null,
    },
    {
      id: 'waste_audit' as TabId,
      label: t.nav.wasteAudit,
      icon: Trash2,
      badge: null,
    },
    {
      id: 'dashboard' as TabId,
      label: t.nav.dashboard,
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'delivery' as TabId,
      label: t.nav.delivery,
      icon: Truck,
      badge: activeDeliveriesCount > 0 ? activeDeliveriesCount : null,
      badgeColor: 'bg-emerald-500',
    },
    {
      id: 'driver_portal' as TabId,
      label: t.nav.driverPortal,
      icon: Bike,
      badge: null,
      driverHighlight: true,
    },
    {
      id: 'driver_custody' as TabId,
      label: t.nav.driverCustody,
      icon: Coins,
      badge: null,
    },
    {
      id: 'inventory' as TabId,
      label: t.nav.inventory,
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'purchasing' as TabId,
      label: t.nav.purchasing,
      icon: ArrowDownLeft,
      badge: null,
    },
    {
      id: 'cashbox' as TabId,
      label: t.nav.cashbox,
      icon: DollarSign,
      badge: null,
    },
    {
      id: 'reports' as TabId,
      label: t.nav.reports,
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'audit_log' as TabId,
      label: t.nav.auditLog,
      icon: ShieldAlert,
      badge: null,
    },
    {
      id: 'users' as TabId,
      label: t.nav.users,
      icon: Users,
      badge: null,
    },
    {
      id: 'settings' as TabId,
      label: t.nav.settings,
      icon: Settings,
      badge: null,
    },
    {
      id: 'backup' as TabId,
      label: t.nav.backup,
      icon: Database,
      badge: null,
    },
  ];

  const ROLE_ALLOWED_TABS: Record<string, TabId[]> = {
    owner: [
      'pos',
      'shifts',
      'invoices',
      'today_prices',
      'customers',
      'waste_audit',
      'dashboard',
      'delivery',
      'driver_portal',
      'driver_custody',
      'inventory',
      'purchasing',
      'cashbox',
      'reports',
      'audit_log',
      'users',
      'settings',
      'backup',
    ],
    super_admin: [
      'pos',
      'shifts',
      'invoices',
      'today_prices',
      'customers',
      'waste_audit',
      'dashboard',
      'delivery',
      'driver_portal',
      'driver_custody',
      'inventory',
      'purchasing',
      'cashbox',
      'reports',
      'audit_log',
      'users',
      'settings',
      'backup',
    ],
    manager: [
      'pos',
      'shifts',
      'invoices',
      'today_prices',
      'customers',
      'waste_audit',
      'dashboard',
      'delivery',
      'driver_custody',
      'inventory',
      'purchasing',
      'cashbox',
      'reports',
      'audit_log',
      'users',
      'settings',
    ],
    cashier: ['pos', 'shifts', 'invoices', 'customers', 'delivery', 'driver_custody'],
    driver: ['driver_portal', 'driver_custody'],
    inventory: ['inventory', 'purchasing', 'waste_audit', 'today_prices', 'dashboard'],
    purchasing: ['purchasing', 'inventory', 'today_prices', 'dashboard'],
    dispatcher: ['delivery', 'driver_custody', 'dashboard'],
    accountant: ['cashbox', 'reports', 'shifts', 'invoices', 'customers', 'driver_custody', 'purchasing', 'audit_log', 'dashboard'],
  };

  const allowedTabs = ROLE_ALLOWED_TABS[currentUser.role] || ['pos'];
  const visibleNavItems = navItems.filter((item) => allowedTabs.includes(item.id));

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen?.(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 start-0 z-50 w-64 bg-slate-900 text-slate-200 shrink-0 flex-col justify-between border-e border-slate-800 shadow-2xl md:shadow-none ${
          mobileOpen ? 'flex' : 'hidden md:flex'
        }`}
      >
        <div className="p-3">
          {/* User Badge */}
          <div className="mb-3 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">{t.user.welcome}</div>
            <div className="text-sm font-bold text-white truncate">{currentUser.name}</div>
            <div className="text-[11px] text-emerald-400 font-medium uppercase tracking-wider mt-0.5">
              {currentUser.role.replace('_', ' ')}
            </div>
          </div>

          {/* Navigation list */}
          <nav className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileOpen?.(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : item.highlight
                      ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700/80 hover:text-emerald-300'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-white'
                          : item.highlight
                          ? 'text-emerald-400'
                          : item.driverHighlight
                          ? 'text-sky-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full text-white ${
                        item.badgeColor || 'bg-emerald-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>{activeBranch.code}</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
              v2.0 Stable
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
