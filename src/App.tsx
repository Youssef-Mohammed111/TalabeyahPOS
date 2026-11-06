/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { Sidebar, TabId } from './components/layout/Sidebar.tsx';
import { PosScreen } from './components/pos/PosScreen.tsx';
import { DashboardScreen } from './components/dashboard/DashboardScreen.tsx';
import { DispatchBoard } from './components/delivery/DispatchBoard.tsx';
import { DriverPortal } from './components/delivery/DriverPortal.tsx';
import { DriverCustodyScreen } from './components/custody/DriverCustodyScreen.tsx';
import { InventoryScreen } from './components/inventory/InventoryScreen.tsx';
import { PurchasingScreen } from './components/purchasing/PurchasingScreen.tsx';
import { CashboxScreen } from './components/finance/CashboxScreen.tsx';
import { ReportsScreen } from './components/reports/ReportsScreen.tsx';
import { UsersScreen } from './components/users/UsersScreen.tsx';
import { SettingsScreen } from './components/settings/SettingsScreen.tsx';
import { LoginScreen } from './components/auth/LoginScreen.tsx';
import { ShiftsScreen } from './components/shifts/ShiftsScreen.tsx';
import { InvoicesAndReturnsScreen } from './components/invoices/InvoicesAndReturnsScreen.tsx';
import { TodayPricesScreen } from './components/prices/TodayPricesScreen.tsx';
import { CustomersScreen } from './components/customers/CustomersScreen.tsx';
import { WasteAndAuditScreen } from './components/waste/WasteAndAuditScreen.tsx';
import { AuditLogScreen } from './components/audit/AuditLogScreen.tsx';

function MainLayout() {
  const { isAuthenticated, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<TabId>('pos');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Set initial workspace according to user role
  useEffect(() => {
    if (!isAuthenticated) return;
    switch (currentUser.role) {
      case 'driver':
        setActiveTab('driver_portal');
        break;
      case 'cashier':
        setActiveTab('pos');
        break;
      case 'inventory':
        setActiveTab('inventory');
        break;
      case 'purchasing':
        setActiveTab('purchasing');
        break;
      case 'dispatcher':
        setActiveTab('delivery');
        break;
      case 'accountant':
        setActiveTab('cashbox');
        break;
      case 'owner':
      case 'manager':
      case 'super_admin':
      default:
        // Keep pos or dashboard
        break;
    }
  }, [currentUser.id, currentUser.role, isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Dedicated full-screen touchscreen POS workstation matching commercial cash register terminals
  if (activeTab === 'pos') {
    return (
      <PosScreen
        onNavigate={(tab) => setActiveTab(tab)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header onToggleMobileMenu={() => setMobileOpen((prev) => !prev)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardScreen setActiveTab={setActiveTab} />}
          {activeTab === 'shifts' && <ShiftsScreen />}
          {activeTab === 'invoices' && <InvoicesAndReturnsScreen />}
          {activeTab === 'today_prices' && <TodayPricesScreen />}
          {activeTab === 'customers' && <CustomersScreen />}
          {activeTab === 'waste_audit' && <WasteAndAuditScreen />}
          {activeTab === 'delivery' && <DispatchBoard />}
          {activeTab === 'driver_portal' && <DriverPortal />}
          {activeTab === 'driver_custody' && <DriverCustodyScreen />}
          {activeTab === 'inventory' && <InventoryScreen />}
          {activeTab === 'purchasing' && <PurchasingScreen />}
          {activeTab === 'cashbox' && <CashboxScreen />}
          {activeTab === 'reports' && <ReportsScreen />}
          {activeTab === 'audit_log' && <AuditLogScreen />}
          {activeTab === 'users' && <UsersScreen />}
          {activeTab === 'settings' && <SettingsScreen initialSubTab="general" />}
          {activeTab === 'backup' && <SettingsScreen initialSubTab="backup" />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}

