/**
 * Role-Based Access Control (RBAC) & Permissions Utilities
 */

import { Permission, RoleType, User } from '../types/index.ts';

export const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  super_admin: [
    'view_dashboard',
    'view_pos',
    'create_sale',
    'void_sale',
    'apply_discount',
    'view_costs',
    'view_profits',
    'manage_products',
    'manage_inventory',
    'stock_adjustment',
    'receive_goods',
    'supplier_return',
    'customer_return',
    'manage_delivery',
    'dispatch_order',
    'driver_actions',
    'manage_custody',
    'close_driver_shift',
    'manage_cashbox',
    'approve_expenses',
    'approve_discrepancies',
    'view_reports',
    'export_data',
    'manage_users',
    'manage_settings',
  ],
  owner: [
    'view_dashboard',
    'view_pos',
    'create_sale',
    'void_sale',
    'apply_discount',
    'view_costs',
    'view_profits',
    'manage_products',
    'manage_inventory',
    'stock_adjustment',
    'receive_goods',
    'supplier_return',
    'customer_return',
    'manage_delivery',
    'dispatch_order',
    'manage_custody',
    'close_driver_shift',
    'manage_cashbox',
    'approve_expenses',
    'approve_discrepancies',
    'view_reports',
    'export_data',
    'manage_users',
    'manage_settings',
  ],
  manager: [
    'view_dashboard',
    'view_pos',
    'create_sale',
    'void_sale',
    'apply_discount',
    'view_costs',
    'view_profits',
    'manage_products',
    'manage_inventory',
    'stock_adjustment',
    'receive_goods',
    'supplier_return',
    'customer_return',
    'manage_delivery',
    'dispatch_order',
    'manage_custody',
    'close_driver_shift',
    'manage_cashbox',
    'approve_expenses',
    'approve_discrepancies',
    'view_reports',
    'export_data',
  ],
  cashier: [
    'view_pos',
    'create_sale',
    'manage_delivery', // Can create delivery orders
    'manage_cashbox',
  ],
  inventory: [
    'view_dashboard',
    'manage_products',
    'manage_inventory',
    'stock_adjustment',
    'receive_goods',
    'customer_return',
    'supplier_return',
  ],
  purchasing: [
    'view_dashboard',
    'receive_goods',
    'supplier_return',
    'manage_products',
  ],
  dispatcher: [
    'view_dashboard',
    'manage_delivery',
    'dispatch_order',
    'manage_custody',
  ],
  driver: [
    'driver_actions',
  ],
  accountant: [
    'view_dashboard',
    'view_costs',
    'view_profits',
    'manage_cashbox',
    'manage_custody',
    'close_driver_shift',
    'view_reports',
    'export_data',
  ],
  custom: [],
};

/**
 * Checks if a user has a specific permission
 */
export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user || !user.active) return false;

  // Super admin and owner have all permissions
  if (user.role === 'super_admin' || user.role === 'owner') return true;

  // Custom permissions attached to user directly
  if (user.customPermissions && user.customPermissions.includes(permission)) {
    return true;
  }

  // Role permissions
  const rolePerms = ROLE_PERMISSIONS[user.role] || [];
  return rolePerms.includes(permission);
}

/**
 * Friendly names for roles in Arabic and English
 */
export const ROLE_LABELS: Record<RoleType, { ar: string; en: string }> = {
  super_admin: { ar: 'مدير عام النظام (SaaS Super Admin)', en: 'SaaS Super Admin' },
  owner: { ar: 'مالك النشاط (Owner)', en: 'Business Owner' },
  manager: { ar: 'مدير الفرع / مشرف (Manager)', en: 'Branch Manager' },
  cashier: { ar: 'كاشير (Cashier)', en: 'Cashier' },
  inventory: { ar: 'مسؤول المخزن (Inventory)', en: 'Inventory Keeper' },
  purchasing: { ar: 'مسؤول المشتريات (Purchasing)', en: 'Purchasing Officer' },
  dispatcher: { ar: 'مسؤول التوصيل (Dispatcher)', en: 'Delivery Dispatcher' },
  driver: { ar: 'مندوب التوصيل (Driver)', en: 'Delivery Driver' },
  accountant: { ar: 'محاسب (Accountant)', en: 'Accountant' },
  custom: { ar: 'دور مخصص (Custom Role)', en: 'Custom Role' },
};
