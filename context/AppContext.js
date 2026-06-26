'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { playChime } from '@/utils/audio';

// ─────────────────────────────────────────────────────────────────────────────
// Initial Data Matrices
// ─────────────────────────────────────────────────────────────────────────────

/** Seed orders data — includes Vodafone Cash metadata fields */
const INITIAL_ORDERS = [];

/** Seed waste/spoilage logs */
const INITIAL_WASTE_LOGS = [];

/** Seed past shift reconciliation records */
const INITIAL_PAST_SHIFTS = [];

/** Seed initial staff directory list */
const INITIAL_STAFF = [
  { id: 101, name: 'أيمن الدمشقي', username: 'ayman@demashki.com', role: 'branch_manager', roleText: 'مدير فرع', branchText: 'الفرع الرئيسي', log: 'نشط في النظام' },
  { id: 102, name: 'باسل محمود', username: 'basel@demashki.com', role: 'branch_manager', roleText: 'مدير فرع', branchText: 'فرع الراهبات', log: 'نشط في النظام' },
  { id: 103, name: 'ياسر كاشير', username: 'yasser@demashki.com', role: 'cashier', roleText: 'كاشير', branchText: 'الفرع الرئيسي', log: 'نشط في النظام' },
];

/** Seed branch table layout maps */
const INITIAL_TABLES_DATA = {
  main: [
    { id: 1, name: 'طاولة 1', capacity: 2, status: 'empty', customer: '', notes: '' },
    { id: 2, name: 'طاولة 2', capacity: 4, status: 'empty', customer: '', notes: '' },
    { id: 3, name: 'طاولة 3', capacity: 6, status: 'empty', customer: '', notes: '' },
    { id: 4, name: 'طاولة 4', capacity: 2, status: 'empty', customer: '', notes: '' },
    { id: 5, name: 'طاولة 5', capacity: 4, status: 'empty', customer: '', notes: '' },
    { id: 6, name: 'طاولة 6', capacity: 8, status: 'empty', customer: '', notes: '' },
    { id: 7, name: 'طاولة 7', capacity: 4, status: 'empty', customer: '', notes: '' },
    { id: 8, name: 'طاولة 8', capacity: 2, status: 'empty', customer: '', notes: '' },
  ],
  rahabat: [
    { id: 1, name: 'طاولة 1', capacity: 4, status: 'empty', customer: '', notes: '' },
    { id: 2, name: 'طاولة 2', capacity: 6, status: 'empty', customer: '', notes: '' },
    { id: 3, name: 'طاولة 3', capacity: 2, status: 'empty', customer: '', notes: '' },
    { id: 4, name: 'طاولة 4', capacity: 4, status: 'empty', customer: '', notes: '' },
    { id: 5, name: 'طاولة 5', capacity: 4, status: 'empty', customer: '', notes: '' },
    { id: 6, name: 'طاولة 6', capacity: 8, status: 'empty', customer: '', notes: '' },
    { id: 7, name: 'طاولة 7', capacity: 2, status: 'empty', customer: '', notes: '' },
    { id: 8, name: 'طاولة 8', capacity: 4, status: 'empty', customer: '', notes: '' },
  ],
};

const INITIAL_BRANCHES = [
  {
    name: 'الفرع الرئيسي',
    code: 'main',
    location: 'دمنهور - شارع المحافظة أمام النادي الاجتماعي',
    tables: 12,
    status: 'نشط',
    manager: 'أيمن الدمشقي',
    openingCash: 1500,
  },
  {
    name: 'فرع الراهبات',
    code: 'rahabat',
    location: 'دمنهور - منتصف شارع الراهبات',
    tables: 8,
    status: 'نشط',
    manager: 'باسل محمود',
    openingCash: 1000,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Safe localStorage helper
// Strips base64 blobs and catches QuotaExceededError gracefully.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Serialise and persist a value to localStorage.
 * – Catches QuotaExceededError so the app never crashes on a full storage.
 * – Accepts an optional `transform` function to sanitise the value before
 *   serialisation (e.g. stripping large binary fields).
 */
function safePersist(key, value, transform) {
  try {
    const payload = transform ? transform(value) : value;
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn(
        `[AppContext] localStorage quota exceeded for key "${key}". ` +
        'Data was NOT saved. Consider clearing browser storage.'
      );
    } else {
      console.error(`[AppContext] Failed to persist "${key}":`, e);
    }
  }
}

/**
 * Strip bulky base64 screenshot blobs before persisting orders.
 * Also caps the list to the 200 most recent entries.
 */
function sanitiseOrders(orders) {
  return orders.slice(0, 200).map((o) => {
    const { screenshot, ...rest } = o; // eslint-disable-line no-unused-vars
    return rest;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AppContext = createContext(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  // ── Cart ──
  const [cartItems, setCartItems] = useState([]);

  // ── Authentication (lazy-init from localStorage) ──
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminRole, setAdminRole] = useState('super_admin');
  const [adminBranch, setAdminBranch] = useState('all');
  const [adminUser, setAdminUser] = useState('');

  // ── ERP Data Matrices ──
  const [orders, setOrders] = useState([]);
  const [wasteLogs, setWasteLogs] = useState([]);
  const [pastShifts, setPastShifts] = useState([]);
  const [tablesData, setTablesData] = useState(INITIAL_TABLES_DATA);
  const [branches, setBranches] = useState(INITIAL_BRANCHES);
  const [menuCatalog, setMenuCatalog] = useState([]);
  const [staff, setStaff] = useState([]);

  // ── Mounted State ──
  const [isMounted, setIsMounted] = useState(false);

  // ── Toast Notification State ──
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  // ── Client-Side Hydration: Restore all states from localStorage ONCE on mount ──
  useEffect(() => {
    // Only runs on client after mount (SSR-safe)
    const mockCleared = localStorage.getItem('demashki_mock_cleared_v6');
    if (!mockCleared) {
      localStorage.removeItem('demashki_orders');
      localStorage.removeItem('demashki_waste');
      localStorage.removeItem('demashki_shifts');
      localStorage.removeItem('demashki_menu');
      localStorage.removeItem('demashki_tables');
      localStorage.removeItem('demashki_past_shifts');
      localStorage.removeItem('demashki_tables_data');
      localStorage.removeItem('demashki_branches'); // Reset branches to clean INITIAL_BRANCHES
      localStorage.removeItem('demashki_menu_catalog'); // Reset menu catalog
      localStorage.removeItem('demashki_staff'); // Clear staff accounts
      localStorage.setItem('demashki_mock_cleared_v6', 'true');
      // Trigger a page refresh to force-initialize everything to the clean slate
      window.location.reload();
      return;
    }

    const storedAuth = localStorage.getItem('demashki_auth');
    const storedRole = localStorage.getItem('demashki_role');
    const storedBranch = localStorage.getItem('demashki_branch');
    const storedUser = localStorage.getItem('demashki_user');

    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    if (storedRole) {
      setAdminRole(storedRole);
    }
    if (storedBranch) {
      setAdminBranch(storedBranch);
    }
    if (storedUser) {
      setAdminUser(storedUser);
    }

    // Hydrate ERP Data Matrices
    const storedOrders = localStorage.getItem('demashki_orders');
    if (storedOrders) {
      try {
        setOrders(JSON.parse(storedOrders));
      } catch (e) {
        console.error('Error parsing orders from localStorage', e);
      }
    }

    const storedWaste = localStorage.getItem('demashki_waste');
    if (storedWaste) {
      try {
        setWasteLogs(JSON.parse(storedWaste));
      } catch (e) {
        console.error('Error parsing wasteLogs from localStorage', e);
      }
    }

    const storedShifts = localStorage.getItem('demashki_shifts');
    if (storedShifts) {
      try {
        setPastShifts(JSON.parse(storedShifts));
      } catch (e) {
        console.error('Error parsing pastShifts from localStorage', e);
      }
    }

    const storedTables = localStorage.getItem('demashki_tables');
    if (storedTables) {
      try {
        setTablesData(JSON.parse(storedTables));
      } catch (e) {
        console.error('Error parsing tablesData from localStorage', e);
      }
    }

    const storedBranches = localStorage.getItem('demashki_branches');
    if (storedBranches) {
      try {
        setBranches(JSON.parse(storedBranches));
      } catch (e) {
        console.error('Error parsing branches from localStorage', e);
      }
    }

    const storedMenu = localStorage.getItem('demashki_menu');
    if (storedMenu) {
      try {
        setMenuCatalog(JSON.parse(storedMenu));
      } catch (e) {
        console.error('Error parsing menuCatalog from localStorage', e);
      }
    }

    const storedStaff = localStorage.getItem('demashki_staff');
    if (storedStaff) {
      try {
        setStaff(JSON.parse(storedStaff));
      } catch (e) {
        console.error('Error parsing staff from localStorage', e);
      }
    } else {
      setStaff(INITIAL_STAFF);
    }

    setIsMounted(true);
  }, []);

  // ── Persist auth state changes to localStorage ──
  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('demashki_auth', isAuthenticated ? 'true' : 'false');
        localStorage.setItem('demashki_role', adminRole);
        localStorage.setItem('demashki_branch', adminBranch);
        localStorage.setItem('demashki_user', adminUser);
      } catch (e) {
        console.warn('[AppContext] Could not persist auth state:', e);
      }
    }
  }, [isAuthenticated, adminRole, adminBranch, adminUser, isMounted]);

  // ── Persist branches state changes to localStorage ──
  useEffect(() => {
    if (isMounted) safePersist('demashki_branches', branches);
  }, [branches, isMounted]);

  // ── Persist menu catalog state changes to localStorage ──
  useEffect(() => {
    if (isMounted) safePersist('demashki_menu', menuCatalog);
  }, [menuCatalog, isMounted]);

  // ── Persist staff state changes to localStorage ──
  useEffect(() => {
    if (isMounted) safePersist('demashki_staff', staff);
  }, [staff, isMounted]);

  // ── Persist orders — strip base64 screenshots, cap at 200 entries ──
  useEffect(() => {
    if (isMounted) safePersist('demashki_orders', orders, sanitiseOrders);
  }, [orders, isMounted]);

  // ── Persist waste state changes to localStorage ──
  useEffect(() => {
    if (isMounted) safePersist('demashki_waste', wasteLogs);
  }, [wasteLogs, isMounted]);

  // ── Persist past shifts state changes to localStorage ──
  useEffect(() => {
    if (isMounted) safePersist('demashki_shifts', pastShifts);
  }, [pastShifts, isMounted]);

  // ── Persist tables state changes to localStorage ──
  useEffect(() => {
    if (isMounted) safePersist('demashki_tables', tablesData);
  }, [tablesData, isMounted]);

  // ── Auto-dismiss toast after 3 seconds ──
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // ── Show Toast (with optional chime) ──
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // ── Show Toast with Chime (combined utility) ──
  const showToastWithChime = useCallback((message, type = 'success') => {
    playChime();
    showToast(message, type);
  }, [showToast]);

  // ── Cart Helpers ──
  const addToCart = useCallback((item) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: (i.qty || 1) + 1 } : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((index) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const decrementCartItem = useCallback((id) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (!existing) return prev;
      if ((existing.qty || 1) <= 1) {
        // Remove the item entirely when qty would reach 0
        return prev.filter((i) => i.id !== id);
      }
      return prev.map((i) =>
        i.id === id ? { ...i, qty: (i.qty || 1) - 1 } : i
      );
    });
  }, []);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);

  // ── Context Value ──
  const value = {
    // Cart
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    decrementCartItem,
    clearCart,
    cartTotal,

    // Auth
    isAuthenticated,
    setIsAuthenticated,
    adminRole,
    setAdminRole,
    adminBranch,
    setAdminBranch,
    adminUser,
    setAdminUser,

    // ERP Data
    orders,
    setOrders,
    wasteLogs,
    setWasteLogs,
    pastShifts,
    setPastShifts,
    tablesData,
    setTablesData,
    branches,
    setBranches,
    menuCatalog,
    setMenuCatalog,
    menuItems: menuCatalog,
    setMenuItems: setMenuCatalog,
    staff,
    setStaff,
    isMounted,

    // Toast
    toast,
    showToast,
    hideToast,
    showToastWithChime,

    // Audio
    playChime,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Consumer Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Custom hook to consume the AppContext.
 * Must be used within an <AppProvider>.
 *
 * @example
 *   const { cartItems, addToCart, showToast, orders } = useAppContext();
 */
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an <AppProvider>');
  }
  return context;
}

export default AppContext;
