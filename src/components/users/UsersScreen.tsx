import React from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { ROLE_PERMISSIONS, ROLE_LABELS } from '../../utils/rbac.ts';
import { Users, Shield, Check, X, Phone, Building } from 'lucide-react';

export const UsersScreen: React.FC = () => {
  const { lang, t, users, branches, currentUser, setCurrentUser } = useStore();

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>{t.nav.users} (Staff & Role-Based Access Control)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'ar'
              ? 'إدارة صلاحيات الموظفين، الأدوار القياسية والصلاحيات الدقيقة لكل شاشة وإجراء'
              : 'Staff list, role templates and granular permission assignments'}
          </p>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {users.map((user) => {
          const roleLabel = lang === 'ar' ? ROLE_LABELS[user.role].ar : ROLE_LABELS[user.role].en;
          const userPermissions = ROLE_PERMISSIONS[user.role] || [];
          const isCurrent = user.id === currentUser.id;

          return (
            <div
              key={user.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                isCurrent ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{user.name}</h3>
                      <span className="text-[11px] text-slate-500 font-mono">@{user.username}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                    نشط
                  </span>
                </div>

                <div className="my-2 p-2 bg-slate-50 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>الدور الإداري:</span>
                    <span className="font-bold text-slate-800">{roleLabel}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>الهاتف:</span>
                      <span className="font-mono text-slate-700" dir="ltr">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-600">
                    <span>عدد الصلاحيات الممنوحة:</span>
                    <span className="font-bold text-emerald-700">{userPermissions.length} صلاحية</span>
                  </div>
                </div>

                {/* Key Permissions Preview */}
                <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                  <div className="font-bold text-slate-700 mb-1">أبرز الصلاحيات:</div>
                  <div className="flex flex-wrap gap-1">
                    {userPermissions.slice(0, 5).map((p) => (
                      <span key={p} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                        {p}
                      </span>
                    ))}
                    {userPermissions.length > 5 && (
                      <span className="text-slate-400 text-[10px] self-center">
                        +{userPermissions.length - 5} المزيد
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom: Switch to this user */}
              <div className="pt-3 border-t border-slate-100 mt-3">
                {isCurrent ? (
                  <div className="w-full py-1.5 text-center text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg">
                    المستخدم النشط حالياً
                  </div>
                ) : (
                  <button
                    onClick={() => setCurrentUser(user)}
                    className="w-full py-1.5 text-center text-xs font-bold text-slate-700 hover:text-white bg-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    تجربة النظام بحساب {user.name.split(' ')[0]}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
