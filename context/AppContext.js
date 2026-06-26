'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { playChime } from '@/utils/audio';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

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

  // ── Authentication (lazy-init from sessionStorage / localStorage) ──
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminRole, setAdminRole] = useState('super_admin');
  const [adminBranch, setAdminBranch] = useState('all');
  const [adminUser, setAdminUser] = useState('');

  // ── ERP Data Matrices (react state driven by Firestore) ──
  const [orders, setOrdersState] = useState([]);
  const [wasteLogs, setWasteLogsState] = useState([]);
  const [pastShifts, setPastShiftsState] = useState([]);
  const [tablesData, setTablesDataState] = useState(INITIAL_TABLES_DATA);
  const [branches, setBranchesState] = useState(INITIAL_BRANCHES);
  const [menuCatalog, setMenuCatalogState] = useState([]);
  const [staff, setStaffState] = useState([]);

  // ── Mounted State ──
  const [isMounted, setIsMounted] = useState(false);

  // ── Toast Notification State ──
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  // ── Sync Helper function for diff-based writes ──
  const syncCollection = useCallback(async (collectionName, nextItems, currentItems, keyName = 'id') => {
    try {
      const currentMap = new Map(currentItems.map(item => [String(item[keyName]), item]));
      const nextMap = new Map(nextItems.map(item => [String(item[keyName]), item]));

      // Write / update changed or new items
      for (const [key, item] of nextMap.entries()) {
        const currentVal = currentMap.get(key);
        if (!currentVal || JSON.stringify(currentVal) !== JSON.stringify(item)) {
          await setDoc(doc(db, collectionName, key), item);
        }
      }

      // Delete removed items
      for (const key of currentMap.keys()) {
        if (!nextMap.has(key)) {
          await deleteDoc(doc(db, collectionName, key));
        }
      }
    } catch (e) {
      console.error(`Error syncing collection ${collectionName} with Firestore:`, e);
    }
  }, []);

  // ── Custom State Setters that sync to Firestore ──
  const setOrders = useCallback((arg) => {
    const nextOrders = typeof arg === 'function' ? arg(orders) : arg;
    const sanitised = sanitiseOrders(nextOrders);
    syncCollection('orders', sanitised, orders, 'id');
  }, [orders, syncCollection]);

  const setWasteLogs = useCallback((arg) => {
    const nextWaste = typeof arg === 'function' ? arg(wasteLogs) : arg;
    syncCollection('waste', nextWaste, wasteLogs, 'id');
  }, [wasteLogs, syncCollection]);

  const setPastShifts = useCallback((arg) => {
    const nextShifts = typeof arg === 'function' ? arg(pastShifts) : arg;
    syncCollection('shifts', nextShifts, pastShifts, 'id');
  }, [pastShifts, syncCollection]);

  const setBranches = useCallback((arg) => {
    const nextBranches = typeof arg === 'function' ? arg(branches) : arg;
    syncCollection('branches', nextBranches, branches, 'code');
  }, [branches, syncCollection]);

  const setMenuCatalog = useCallback((arg) => {
    const nextMenu = typeof arg === 'function' ? arg(menuCatalog) : arg;
    syncCollection('menu', nextMenu, menuCatalog, 'id');
  }, [menuCatalog, syncCollection]);

  const setStaff = useCallback((arg) => {
    const nextStaff = typeof arg === 'function' ? arg(staff) : arg;
    syncCollection('staff', nextStaff, staff, 'id');
  }, [staff, syncCollection]);

  const setTablesData = useCallback((arg) => {
    const nextTables = typeof arg === 'function' ? arg(tablesData) : arg;
    try {
      Object.keys(nextTables).forEach(async (branchKey) => {
        const nextBranchTables = nextTables[branchKey] || [];
        const currentBranchTables = tablesData[branchKey] || [];
        if (JSON.stringify(nextBranchTables) !== JSON.stringify(currentBranchTables)) {
          await setDoc(doc(db, 'tables', branchKey), { tables: nextBranchTables });
        }
      });
    } catch (e) {
      console.error('Error syncing tablesData with Firestore:', e);
    }
  }, [tablesData]);

  // ── Client-Side Hydration: Restore Auth once on mount (using sessionStorage/localStorage) ──
  useEffect(() => {
    const storedAuth = sessionStorage.getItem('demashki_auth') || localStorage.getItem('demashki_auth');
    const storedRole = sessionStorage.getItem('demashki_role') || localStorage.getItem('demashki_role');
    const storedBranch = sessionStorage.getItem('demashki_branch') || localStorage.getItem('demashki_branch');
    const storedUser = sessionStorage.getItem('demashki_user') || localStorage.getItem('demashki_user');

    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      signInAnonymously(auth).catch((err) =>
        console.warn('Firebase anonymous sign-in error:', err)
      );
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
  }, []);

  // ── Persist Auth state changes to sessionStorage & localStorage ──
  useEffect(() => {
    if (isMounted) {
      try {
        const authStr = isAuthenticated ? 'true' : 'false';
        sessionStorage.setItem('demashki_auth', authStr);
        sessionStorage.setItem('demashki_role', adminRole);
        sessionStorage.setItem('demashki_branch', adminBranch);
        sessionStorage.setItem('demashki_user', adminUser);

        localStorage.setItem('demashki_auth', authStr);
        localStorage.setItem('demashki_role', adminRole);
        localStorage.setItem('demashki_branch', adminBranch);
        localStorage.setItem('demashki_user', adminUser);
      } catch (e) {
        console.warn('[AppContext] Could not persist auth state:', e);
      }
    }
  }, [isAuthenticated, adminRole, adminBranch, adminUser, isMounted]);

  // ── Firestore Real-time Subscriptions ──
  useEffect(() => {
    // 1. Subscribe to orders
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data()));
      list.sort((a, b) => (b.id || 0) - (a.id || 0));
      setOrdersState(list);
    });

    // 2. Subscribe to tables
    const unsubTables = onSnapshot(collection(db, 'tables'), (snapshot) => {
      const data = {};
      snapshot.forEach((docSnap) => {
        data[docSnap.id] = docSnap.data().tables || [];
      });
      if (Object.keys(data).length > 0) {
        setTablesDataState(data);
      } else {
        // Seed initial tables data to Firestore
        Object.keys(INITIAL_TABLES_DATA).forEach((branchKey) => {
          setDoc(doc(db, 'tables', branchKey), { tables: INITIAL_TABLES_DATA[branchKey] });
        });
        setTablesDataState(INITIAL_TABLES_DATA);
      }
    });

    // 3. Subscribe to branches
    const unsubBranches = onSnapshot(collection(db, 'branches'), (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data()));
      if (list.length > 0) {
        setBranchesState(list);
      } else {
        // Seed initial branches to Firestore
        INITIAL_BRANCHES.forEach((b) => {
          setDoc(doc(db, 'branches', b.code), b);
        });
        setBranchesState(INITIAL_BRANCHES);
      }
    });

    // 4. Subscribe to menu
    const unsubMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data()));
      list.sort((a, b) => (a.id || 0) - (b.id || 0));
      setMenuCatalogState(list);
    });

    // 5. Subscribe to waste
    const unsubWaste = onSnapshot(collection(db, 'waste'), (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data()));
      list.sort((a, b) => (b.id || 0) - (a.id || 0));
      setWasteLogsState(list);
    });

    // 6. Subscribe to shifts
    const unsubShifts = onSnapshot(collection(db, 'shifts'), (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data()));
      list.sort((a, b) => (b.id || 0) - (a.id || 0));
      setPastShiftsState(list);
    });

    // 7. Subscribe to staff
    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data()));
      list.sort((a, b) => (a.id || 0) - (b.id || 0));
      if (list.length > 0) {
        setStaffState(list);
      } else {
        // Seed initial staff to Firestore
        INITIAL_STAFF.forEach((s) => {
          setDoc(doc(db, 'staff', String(s.id)), s);
        });
        setStaffState(INITIAL_STAFF);
      }
    });

    setIsMounted(true);

    return () => {
      unsubOrders();
      unsubTables();
      unsubBranches();
      unsubMenu();
      unsubWaste();
      unsubShifts();
      unsubStaff();
    };
  }, []);

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
