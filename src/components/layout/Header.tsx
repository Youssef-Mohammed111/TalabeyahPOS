import React from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { ROLE_LABELS } from '../../utils/rbac.ts';
import { formatMoney } from '../../utils/accounting.ts';
import {
  Globe,
  Store,
  UserCheck,
  Wallet,
  Clock,
  Sparkles,
  ChevronDown,
  Menu,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    lang,
    setLang,
    t,
    currentUser,
    activeBranch,
    setActiveBranchId,
    branches,
    cashboxes,
    logout,
  } = useStore();

  const activeCashbox = cashboxes.find((c) => c.branchId === activeBranch.id && c.active) || cashboxes[0];

  // Branches authorized for current user
  const authorizedBranches = branches.filter((b) => {
    if (currentUser.role === 'owner' || currentUser.role === 'super_admin') return true;
    if (!currentUser.assignedBranches || currentUser.assignedBranches.length === 0) return true;
    return currentUser.assignedBranches.includes(b.id);
  });

  const canSwitchBranch = authorizedBranches.length > 1;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-3 sm:px-4 py-2.5 shadow-xs">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Hamburger (mobile only) + Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-xs">
            ط
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                {t.appName}
              </h1>
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                POS v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 hidden lg:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap justify-end">
          {/* Branch Indicator / Switcher */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700">
            <Store className="w-3.5 h-3.5 text-slate-500" />
            {canSwitchBranch ? (
              <select
                value={activeBranch.id}
                onChange={(e) => setActiveBranchId(e.target.value)}
                className="bg-transparent font-semibold focus:outline-none cursor-pointer"
                aria-label={t.user.branch}
              >
                {authorizedBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {lang === 'ar' ? b.nameAr : b.nameEn}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-semibold text-slate-800">
                {lang === 'ar' ? activeBranch.nameAr : activeBranch.nameEn}
              </span>
            )}
          </div>

          {/* Active Cashbox Balance Pill */}
          {activeCashbox && (
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 rounded-lg px-3 py-1 text-xs">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-600 font-medium">
                {lang === 'ar' ? 'درج الكاشير:' : 'Drawer:'}
              </span>
              <span className="font-bold text-emerald-800">
                {formatMoney(activeCashbox.currentBalance, lang)}
              </span>
            </div>
          )}

          {/* Logged in User Badge */}
          <div className="flex items-center gap-2 bg-slate-100/90 border border-slate-200/90 rounded-lg px-2.5 py-1 text-xs text-slate-800">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold truncate max-w-[110px] sm:max-w-none">
              {currentUser.name.split(' ')[0]}
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {ROLE_LABELS[currentUser.role][lang === 'ar' ? 'ar' : 'en'].split(' ')[0]}
            </span>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 rounded-lg px-2 py-1 text-[11px] sm:text-xs font-semibold text-slate-800 cursor-pointer"
            title="Switch Language / تبديل اللغة"
          >
            <Globe className="w-3.5 h-3.5 text-slate-600" />
            <span>{t.common.language}</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200 rounded-lg px-2 py-1 text-[11px] sm:text-xs font-bold cursor-pointer"
            title={lang === 'ar' ? 'تسجيل الخروج من الجلسة' : 'Sign Out'}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'خروج' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
