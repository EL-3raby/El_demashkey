'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

const LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD49pB1_qsZQmcqLHH19jhIwzSFOvatEfigPbPtZAI0rIcIl5RZBW22617oxzqlER5PuuXzEDnq4mm907LLS1lT1zGssEV5VBGq0K7CaIy19HcXwSmYYm8LuZuLU2CHoCvVlpPkkbMCTGyi3ZjhWddjLfdxY-Rz2oZBLn3TA4D7CeInXJRlhBlVc-5VJwqKjX_OT5_ufineBawDKlknVlDhjJAM1ReWZEArHya0FzpsOcBw3GLFYvPl5RSc8krTvwRroeOupRYqTA';

/**
 * Resolves the Arabic display name for an admin role key.
 */
const ROLE_LABELS = {
  super_admin: 'مدير عام',
  branch_manager: 'مدير فرع',
  cashier: 'كاشير',
};

/**
 * Master navigation node definitions.
 * Each node carries an RBAC `visibleTo` predicate that is evaluated
 * against the current role to determine visibility.
 */
const NAV_NODES = [
  {
    href: '/admin',
    label: 'لوحة المؤشرات',
    icon: 'dashboard',
    exactMatch: true,
    visibleTo: (role) => role === 'super_admin' || role === 'branch_manager',
  },
  {
    href: '/admin/orders',
    label: 'الطلبـات النشطة',
    icon: 'pending_actions',
    visibleTo: () => true, // All roles
  },
  {
    href: '/admin/shifts',
    label: 'إدارة الورديات',
    icon: 'point_of_sale',
    visibleTo: () => true, // All roles
  },
  {
    href: '/admin/menu-editor',
    label: 'إدارة المنيو',
    icon: 'menu_book',
    visibleTo: (role) => role === 'super_admin' || role === 'branch_manager',
  },
  {
    href: '/admin/tables',
    label: 'توزيع الطاولات',
    icon: 'table_restaurant',
    visibleTo: () => true, // All roles
  },
  {
    href: '/admin/waste',
    label: 'مراقب الهالك',
    icon: 'delete_sweep',
    visibleTo: (role) => role !== 'cashier',
  },
  {
    href: '/admin/create-accounts',
    label: 'إنشاء حسابات الفروع',
    icon: 'person_add',
    visibleTo: (role) => role === 'super_admin',
  },
  {
    href: '/admin/staff',
    label: 'طاقم العمل العام',
    icon: 'badge',
    visibleTo: (role) => role === 'super_admin',
  },
  {
    href: '/admin/branches',
    label: 'إعدادات الفروع',
    icon: 'settings_applications',
    visibleTo: (role) => role === 'super_admin',
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    adminRole,
    adminBranch,
    adminUser,
    setIsAuthenticated,
    setAdminRole,
    setAdminBranch,
    showToast,
    orders,
  } = useAppContext();

  const currentRole = adminRole;

  // Dynamically calculate the active pending order count with branch isolation
  const pendingCount = orders
    ? orders.filter((o) => {
        const isActiveStatus =
          o.status === 'جاري التحضير' || o.status === 'بانتظار مراجعة الدفع';
        // If Super Admin, show all branches. If branch manager or cashier, show ONLY their current branch orders.
        if (adminBranch === 'all') {
          return isActiveStatus;
        }
        return isActiveStatus && o.branch === adminBranch;
      }).length
    : 0;

  /**
   * Route matching: exact match for `/admin` dashboard,
   * prefix match for all other admin sub-routes.
   */
  const isActive = (href, exactMatch = false) => {
    if (exactMatch) return pathname === href;
    return pathname.startsWith(href);
  };

  /**
   * Logout handler:
   * 1. Reset all auth state in context
   * 2. Flush all `demashki_*` keys from localStorage
   * 3. Show farewell toast
   * 4. Redirect to /admin/login
   */
  const handleLogout = () => {
    // Flush context
    setIsAuthenticated(false);
    setAdminRole('super_admin');
    setAdminBranch('all');

    // Flush localStorage
    localStorage.removeItem('demashki_auth');
    localStorage.removeItem('demashki_role');
    localStorage.removeItem('demashki_branch');
    localStorage.removeItem('demashki_user');

    showToast('تم تسجيل الخروج بنجاح', 'warning');
    router.push('/admin/login');
  };

  // ── RBAC: Filter visible navigation nodes for current role ──
  const visibleNodes = NAV_NODES.filter((node) => node.visibleTo(currentRole));

  return (
    <aside className="w-64 bg-surface-container-high border-l border-outline-variant/30 flex flex-col shrink-0 text-right">
      {/* ── Brand Header ── */}
      <div className="p-6 border-b border-outline-variant/30 flex flex-row-reverse items-center justify-between gap-2">
        <div className="flex flex-row-reverse items-center gap-2">
          <img
            className="h-8 w-8 object-contain"
            src={LOGO_URL}
            alt="Demashki Logo"
          />
          <span className="font-bold text-primary text-lg">دمشقي أدمن</span>
        </div>
      </div>

      {/* ── User Info Panel ── */}
      <div className="p-4 border-b border-outline-variant/20 bg-surface-container/50 text-xs font-semibold text-on-surface-variant flex flex-col gap-1">
        <div>
          المستخدم:{' '}
          <span className="text-primary font-bold">
            {adminUser || 'مسؤول'}
          </span>
        </div>
        <div>
          الدور:{' '}
          <span className="text-on-surface font-bold">
            {ROLE_LABELS[currentRole] || currentRole}
          </span>
        </div>
      </div>

      {/* ── Navigation Links (RBAC-filtered) ── */}
      <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
        {visibleNodes.map((node) => {
          const active = isActive(node.href, node.exactMatch);
          const isActiveOrdersNode = node.href === '/admin/orders';

          return (
            <Link
              key={node.href}
              href={node.href}
              className={`flex flex-row-reverse items-center justify-between px-3 py-2.5 rounded transition-all text-sm font-bold ${
                active
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary'
              }`}
            >
              <div className="flex flex-row-reverse items-center gap-3">
                <span className="material-symbols-outlined text-lg">
                  {node.icon}
                </span>
                <span>{node.label}</span>
              </div>
              {isActiveOrdersNode && pendingCount > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono transition-all ${
                    active ? 'bg-white text-primary' : 'bg-primary text-white animate-pulse'
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Logout Button ── */}
      <div className="p-4 border-t border-outline-variant/30">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex flex-row-reverse items-center gap-3 px-3 py-2.5 rounded text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-all text-right"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>تسجيل خروج</span>
        </button>
      </div>
    </aside>
  );
}
