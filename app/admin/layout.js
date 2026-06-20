'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import AdminSidebar from '@/components/AdminSidebar';

/** Resolves the Arabic panel title for the current admin role. */
const ROLE_PANEL_TITLES = {
  super_admin: 'لوحة المدير العام',
  branch_manager: 'لوحة مدير الفرع',
  cashier: 'لوحة الكاشير',
};

/**
 * AdminLayout — wraps all `/admin/*` routes.
 *
 * Responsibilities:
 * 1. Auth guard: redirects unauthenticated users to `/admin/login`
 * 2. Renders the sidebar + top header chrome
 * 3. Passes `children` into the scrollable main content area
 */
export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, adminRole } = useAppContext();

  const isLoginPage = pathname === '/admin/login';

  // ── Auth Guard ──
  // Redirect to login if not authenticated and not already on login page
  useEffect(() => {
    if (!isLoginPage && !isAuthenticated) {
      router.replace('/admin/login');
    }
  }, [pathname, isLoginPage, isAuthenticated, router]);

  // ── Login page renders without the sidebar/header chrome ──
  if (isLoginPage) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-background text-on-background">
        {children}
      </div>
    );
  }

  // ── Guard: don't render admin shell while redirecting ──
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-row-reverse h-screen w-full bg-background text-on-background overflow-hidden animate-fade-in">
      {/* ── Sidebar ── */}
      <AdminSidebar />

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden text-right">
        {/* ── Top Header Bar ── */}
        <header className="h-16 bg-surface-container border-b border-outline-variant/20 flex flex-row-reverse justify-between items-center px-6 shrink-0">
          <div>
            <h2 className="font-bold text-lg text-primary">
              {ROLE_PANEL_TITLES[adminRole] || 'لوحة التحكم'}
            </h2>
          </div>

          <div className="flex flex-row-reverse items-center gap-4 text-xs font-semibold text-on-surface-variant">
            <span>
              {new Date().toLocaleDateString('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
              اتصال نشط
            </span>
          </div>
        </header>

        {/* ── Scrollable Page Content ── */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-background/50">
          {children}
        </main>
      </div>
    </div>
  );
}
