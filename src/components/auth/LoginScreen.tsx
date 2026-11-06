import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { initialUsers } from '../../data/initialData.ts';
import { ROLE_LABELS } from '../../utils/rbac.ts';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Globe,
  Sparkles,
  ShieldCheck,
  Store,
  ArrowRight,
  LogIn,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { lang, setLang, t, login } = useStore();
  const [identifier, setIdentifier] = useState('cashier_mona');
  const [password, setPassword] = useState('cashier123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    setTimeout(() => {
      const res = login(identifier, password);
      if (!res.success) {
        setErrorMessage(res.error || (lang === 'ar' ? 'فشل تسجيل الدخول' : 'Login failed'));
        setLoading(false);
      }
    }, 250);
  };

  const handleQuickFill = (user: (typeof initialUsers)[0]) => {
    setIdentifier(user.username);
    setPassword(user.password || '');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-emerald-900/40">
            ط
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">{t.appName}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                PROD v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400">{t.appSubtitle}</p>
          </div>
        </div>

        {/* Language switch */}
        <button
          type="button"
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'ar' ? 'English (LTR)' : 'عربي (RTL)'}</span>
        </button>
      </header>

      {/* Main Login Card & Quick Roles Box */}
      <main className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-6">
        {/* Left / Primary Login Form */}
        <div className="lg:col-span-6 bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-white">
              {lang === 'ar' ? 'تسجيل الدخول إلى نقطة البيع' : 'Sign in to Talabeyah'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {lang === 'ar'
                ? 'أدخل اسم المستخدم أو البريد الإلكتروني وكلمة المرور'
                : 'Enter your username or email and password to access your workspace'}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {lang === 'ar' ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: cashier_mona' : 'e.g. cashier_mona'}
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white rounded-xl ps-10 pe-3.5 py-2.5 text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white rounded-xl ps-10 pe-10 py-2.5 text-sm outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تسجيل الدخول والبدء' : 'Sign In & Launch Workspace'}</span>
                </>
              )}
            </button>
          </form>

          {/* Security & Audit note */}
          <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {lang === 'ar'
                ? 'جلسة مؤمنة بالكامل مع تسجيل سجل رقابي وتدقيق لجميع الحركات المالية والمخزنية'
                : 'Encrypted operational session with full transactional audit logging for sales and custody'}
            </span>
          </div>
        </div>

        {/* Right / Fast Evaluation Accounts Helper */}
        <div className="lg:col-span-6 bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-200">
              {lang === 'ar' ? 'حسابات التجربة والاختبار السريع (Demo Accounts)' : 'Quick Test Accounts & Workspaces'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            {lang === 'ar'
              ? 'انقر على أي من الأدوار أدناه لملء بيانات الدخول تلقائياً واختبار مساحة العمل المخصصة لكل دور:'
              : 'Click any role below to pre-fill credentials and test that specific role-tailored workspace:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {initialUsers.map((u) => {
              const isSelected = identifier === u.username;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickFill(u)}
                  className={`text-start p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-500/80 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white truncate">{u.name.split(' ')[0]}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono font-semibold">
                      {ROLE_LABELS[u.role][lang === 'ar' ? 'ar' : 'en'].split(' ')[0]}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    user: <span className="text-slate-300">{u.username}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    pass: <span className="text-amber-300">{u.password}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Store className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">
                {lang === 'ar' ? 'بيئة التشغيل:' : 'Active Deployment:'}
              </span>{' '}
              {lang === 'ar'
                ? 'فرع المعادي الرئيسي (CAI-01) وفرع المقطم (CAI-02) - عزل كامل للبيانات مع رصيد حقيقي'
                : 'Maadi Main Branch (CAI-01) & Mokattam (CAI-02) with branch-isolated stocks and cashboxes'}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 pt-4">
        Talabeyah POS © 2026 • Enterprise Retail & Produce Multi-Tenant Solution
      </footer>
    </div>
  );
};
