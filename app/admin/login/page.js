'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

const LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD49pB1_qsZQmcqLHH19jhIwzSFOvatEfigPbPtZAI0rIcIl5RZBW22617oxzqlER5PuuXzEDnq4mm907LLS1lT1zGssEV5VBGq0K7CaIy19HcXwSmYYm8LuZuLU2CHoCvVlpPkkbMCTGyi3ZjhWddjLfdxY-Rz2oZBLn3TA4D7CeInXJRlhBlVc-5VJwqKjX_OT5_ufineBawDKlknVlDhjJAM1ReWZEArHya0FzpsOcBw3GLFYvPl5RSc8krTvwRroeOupRYqTA';

const ROLE_LABELS = {
  super_admin: 'مدير عام',
  branch_manager: 'مدير فرع',
  cashier: 'كاشير',
};

export default function AdminLoginPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    setIsAuthenticated,
    setAdminRole,
    setAdminBranch,
    setAdminUser,
    showToast,
    playChime,
    branches,
  } = useAppContext();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('super_admin');
  const [branch, setBranch] = useState('');

  useEffect(() => {
    if (branches && branches.length > 0 && !branch) {
      setBranch(branches[0].code);
    }
  }, [branches, branch]);

  // ── If already authenticated, redirect to admin dashboard ──
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/admin');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username && password) {
      // Determine effective branch (super_admin sees all branches)
      const finalBranch = role === 'super_admin' ? 'all' : branch;

      // Update context state
      setIsAuthenticated(true);
      setAdminRole(role);
      setAdminBranch(finalBranch);
      setAdminUser(username);

      // Persist to localStorage
      localStorage.setItem('demashki_user', username);
      localStorage.setItem('demashki_auth', 'true');
      localStorage.setItem('demashki_role', role);
      localStorage.setItem('demashki_branch', finalBranch);

      // Audio + visual feedback
      playChime();
      showToast(
        'تم تسجيل الدخول بنجاح كـ ' + (ROLE_LABELS[role] || role),
        'success'
      );

      // Navigate to admin dashboard
      router.push('/admin');
    } else {
      showToast('الرجاء إدخال اسم المستخدم وكلمة المرور', 'error');
    }
  };

  return (
    <main className="flex-grow w-full bg-pattern flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 shadow-lg text-right animate-fade-in">
        {/* ── Logo & Title ── */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img
            alt="Demashki Logo"
            className="h-16 w-16 object-contain mb-3"
            src={LOGO_URL}
          />
          <h1 className="font-display-lg text-primary text-2xl font-bold">
            بوابة الإدارة والمراقبة
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            الرجاء تسجيل الدخول للوصول إلى لوحة التحكم ERP
          </p>
        </div>

        {/* ── Login Form ── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">
              اسم المستخدم / البريد الإلكتروني
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin@demashki.com"
              className="w-full px-4 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none"
            />
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">
              الصفة / الصلاحية
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-on-surface outline-none font-bold text-sm"
            >
              <option value="super_admin">مدير عام (Super Admin)</option>
              <option value="branch_manager">مدير فرع (Branch Manager)</option>
              <option value="cashier">كاشير (Cashier)</option>
            </select>
          </div>

          {/* Conditional Branch Selector (for non-super_admin roles) */}
          {role !== 'super_admin' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-bold text-on-surface-variant mb-1">
                الفرع المسؤول
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-on-surface outline-none font-bold text-sm"
              >
                {branches && branches.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="mt-4 w-full bg-primary text-on-primary py-3.5 rounded-full font-bold hover:bg-primary-container transition-colors shadow-md flex items-center justify-center gap-2 active:scale-90 transition-transform"
          >
            <span>دخول لوحة التحكم</span>
            <span className="material-symbols-outlined text-lg">login</span>
          </button>
        </form>
      </div>
    </main>
  );
}
