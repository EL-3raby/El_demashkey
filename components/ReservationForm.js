'use client';

/**
 * ReservationForm — Unified, reusable table-booking component.
 *
 * Implements the full reservation flow:
 *  • SSR-safe date hydration (minDate via useEffect)
 *  • Dynamic menu sync from global menuCatalog
 *  • Dynamic available-table counter from tablesData context
 *  • Modal-driven meal pre-order with premium Enterprise UI
 *  • ERP order log injection on submit
 *  • Vodafone Cash upload flow
 *  • Confirmation ticket screen
 *
 * Used by:
 *  – /app/(customer)/page.js                          (homepage section)
 *  – /app/(customer)/table-reservation/page.js        (dedicated page)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '@/context/AppContext';

// ─────────────────────────────────────────────────────────────────────────────
// Stock badge
// ─────────────────────────────────────────────────────────────────────────────
const StockBadge = ({ level }) => {
  if (level === 'high')
    return (
      <span className="inline-block bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-bold font-sans">
        متوفر
      </span>
    );
  if (level === 'low')
    return (
      <span className="inline-block bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse font-sans">
        مخزون منخفض
      </span>
    );
  return (
    <span className="inline-block bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold font-sans">
      مستنفذ
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Meal Modal — premium overlay with sticky header/body/footer
// ─────────────────────────────────────────────────────────────────────────────
function MealModal({ meals, onQtyChange, onClose }) {
  const selectedCount = meals.reduce((s, m) => s + m.qty, 0);
  const selectedTotal = meals.reduce((s, m) => s + m.price * m.qty, 0);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="اختيار الوجبات"
    >
      <div className="bg-surface rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

        {/* ── Sticky Header ── */}
        <div className="flex flex-row-reverse items-center justify-between px-6 py-4 border-b border-outline-variant/30 bg-surface shrink-0">
          <div className="flex flex-row-reverse items-center gap-3">
            <span
              className="material-symbols-outlined text-primary text-2xl"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              restaurant_menu
            </span>
            <div className="text-right">
              <h3 className="font-bold text-on-surface text-base leading-tight">
                اختر وجباتك المفضلة
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                يمكنك طلب وجبات مسبقاً مع حجز طاولتك
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer shrink-0"
            aria-label="إغلاق"
          >
            <span className="material-symbols-outlined text-xl text-on-surface-variant">
              close
            </span>
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-container-lowest">
          {meals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-on-surface-variant select-none">
              <span
                className="material-symbols-outlined text-5xl opacity-40"
                style={{ fontVariationSettings: '"FILL" 0' }}
              >
                inventory_2
              </span>
              <p className="font-semibold text-sm">
                لا توجد وجبات متاحة للطلب المسبق حالياً
              </p>
              <p className="text-xs opacity-60 text-center max-w-xs">
                يمكن للمدير إضافة وجبات من لوحة التحكم وستظهر هنا تلقائياً
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className={`relative flex flex-row-reverse gap-4 items-center p-4 rounded-xl border transition-all ${
                    meal.qty > 0
                      ? 'border-primary/50 bg-primary/5 shadow-sm'
                      : 'border-outline-variant/30 bg-surface hover:border-outline-variant/60'
                  }`}
                >
                  {/* Selected check indicator */}
                  {meal.qty > 0 && (
                    <span
                      className="absolute top-2 left-2 material-symbols-outlined text-primary text-base"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      check_circle
                    </span>
                  )}

                  {/* Meal image */}
                  {meal.img ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container">
                      <img
                        src={meal.img}
                        alt={meal.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg shrink-0 bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant opacity-40">
                        restaurant
                      </span>
                    </div>
                  )}

                  {/* Info + stepper */}
                  <div className="flex-1 text-right flex flex-col gap-2 min-w-0">
                    <div>
                      <div className="font-bold text-sm text-on-surface truncate">
                        {meal.name}
                      </div>
                      <div className="flex flex-row-reverse items-center gap-2 mt-0.5">
                        <span className="text-primary font-bold text-sm font-sans">
                          {meal.price} ج.م
                        </span>
                        <StockBadge level={meal.stockLevel} />
                      </div>
                    </div>

                    {/* Quantity stepper */}
                    <div className="flex flex-row-reverse items-center gap-2 font-sans">
                      <button
                        type="button"
                        disabled={meal.qty === 0}
                        onClick={() => onQtyChange(meal.id, -1)}
                        className="w-8 h-8 rounded-lg bg-surface-container border border-outline-variant/40 flex items-center justify-center font-bold text-sm hover:bg-error/10 hover:text-error hover:border-error/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">remove</span>
                      </button>
                      <span className="font-mono font-bold text-base w-6 text-center text-on-surface">
                        {meal.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onQtyChange(meal.id, 1)}
                        className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-container transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Sticky Footer ── */}
        <div className="shrink-0 px-6 py-4 border-t border-outline-variant/30 bg-surface flex flex-row-reverse items-center justify-between gap-4">
          <div className="text-right">
            {selectedCount > 0 ? (
              <>
                <p className="text-xs text-on-surface-variant">إجمالي الطلب المسبق</p>
                <p className="font-bold text-primary text-lg font-sans leading-tight">
                  {selectedTotal} ج.م
                  <span className="text-xs font-normal text-on-surface-variant mr-1">
                    ({selectedCount} {selectedCount === 1 ? 'صنف' : 'أصناف'})
                  </span>
                </p>
              </>
            ) : (
              <p className="text-sm text-on-surface-variant font-semibold">
                لم يتم اختيار أي وجبات بعد
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold text-sm hover:bg-primary-container transition-colors shadow-sm cursor-pointer font-sans"
          >
            <span className="material-symbols-outlined text-base">check</span>
            تأكيد وإغلاق
          </button>
        </div>

      </div>
    </div>
  );

  // Render into document.body via portal for correct z-index stacking
  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function ReservationForm() {
  const { showToast, orders, setOrders, playChime, tablesData, setTablesData, menuCatalog } =
    useAppContext();

  // ── Form state ──
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState('2');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [branch, setBranch] = useState('main');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [minDate, setMinDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── SSR-safe: hydrate minDate + default date on client mount ──
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setMinDate(today);
    setDate(today);
  }, []);

  // ── Booking meals: driven entirely by live menuCatalog ──
  const [bookingMeals, setBookingMeals] = useState([]);

  useEffect(() => {
    setBookingMeals(
      (menuCatalog || [])
        .filter((item) => item.active !== false)
        .map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          img: item.img || null,
          qty: 0,
          stockLevel: item.stockLevel || 'high',
        }))
    );
  }, [menuCatalog]);

  // ── Modal state ──
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Dynamic available tables for selected branch ──
  const currentBranchTables = (tablesData && tablesData[branch]) || [];
  const emptyTablesCount = currentBranchTables.filter(
    (t) => t.status === 'empty'
  ).length;

  // ── Confirmation state ──
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketCode, setTicketCode] = useState('');

  // ── Derived cart values ──
  const selectedCount = useMemo(
    () => bookingMeals.reduce((s, m) => s + m.qty, 0),
    [bookingMeals]
  );
  const selectedTotal = useMemo(
    () => bookingMeals.reduce((s, m) => s + m.price * m.qty, 0),
    [bookingMeals]
  );

  // ── Handlers ──
  const handleMealQty = useCallback((id, delta) => {
    setBookingMeals((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, qty: Math.max(0, m.qty + delta) } : m
      )
    );
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setScreenshotUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone || !date || !time) return;

    setIsSubmitting(true);

    const code = 'DM-' + Math.floor(1000 + Math.random() * 9000);
    setTicketCode(code);

    playChime();

    const selectedMealsStr = bookingMeals
      .filter((m) => m.qty > 0)
      .map((m) => `${m.name} (${m.qty})`)
      .join(' + ');

    const newOrderLog = {
      id: Math.floor(100 + Math.random() * 900),
      customer: name,
      items: selectedMealsStr || 'حجز طاولة فقط',
      total: selectedTotal || 0,
      type: 'حجز صالة',
      branch,
      status:
        paymentMethod === 'vodafone'
          ? 'بانتظار مراجعة الدفع'
          : 'جاري التحضير',
      secondsLeft: 1200,
      paymentMethod,
      screenshot:
        screenshotUrl ||
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400',
      date: new Date().toLocaleString('ar-EG'),
    };

    // Auto-allocate table (React Safe Deep-Copy Mutation)
    const branchTables = tablesData[branch] || [];
    const tableIndex = branchTables.findIndex((t) => t.status === 'empty');
    
    if (tableIndex !== -1) {
      setTablesData((prev) => {
        const updatedBranchTables = [...prev[branch]];
        updatedBranchTables[tableIndex] = {
          ...updatedBranchTables[tableIndex],
          status: 'reserved',
          customer: name,
          notes: `حجز إلكتروني: ${date} في ${time} (${guests} أفراد)`
        };
        return { ...prev, [branch]: updatedBranchTables };
      });
    }

    setOrders([newOrderLog, ...orders]);
    setIsSubmitted(true);
    setIsSubmitting(false);
    showToast('تم إرسال طلب الحجز بنجاح! كود الحجز: ' + code, 'success');
  };

  // ─── Confirmation screen ──────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-8 max-w-lg w-full mx-auto text-center shadow-lg animate-fade-in font-sans">
        <span
          className="material-symbols-outlined text-6xl text-primary mb-4 block"
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          check_circle
        </span>
        <h2 className="font-display-lg text-2xl text-primary font-bold mb-2">
          تم تأكيد الحجز بنجاح!
        </h2>
        <p className="font-body-md text-on-surface-variant mb-6">
          يسعدنا استقبالكم في الموعد المحدد. رمز الحجز الخاص بك هو:
        </p>
        <div className="bg-secondary-container text-primary font-bold text-xl py-3 rounded-full mb-6 font-mono tracking-widest">
          {ticketCode}
        </div>
        <div className="text-right border-t border-outline-variant/20 pt-4 flex flex-col gap-2 mb-6 text-sm">
          <div>
            <strong className="text-primary">الاسم:</strong> {name}
          </div>
          <div>
            <strong className="text-primary">الهاتف:</strong> {phone}
          </div>
          <div>
            <strong className="text-primary">عدد الأفراد:</strong> {guests} أفراد
          </div>
          <div>
            <strong className="text-primary">الفرع:</strong>{' '}
            {branch === 'rahabat' ? 'فرع الراهبات' : 'الفرع الرئيسي'}
          </div>
          <div>
            <strong className="text-primary">التاريخ والوقت:</strong> {date} في {time}
          </div>
          {selectedCount > 0 && (
            <div>
              <strong className="text-primary">الوجبات المطلوبة:</strong>{' '}
              {bookingMeals
                .filter((m) => m.qty > 0)
                .map((m) => `${m.name} ×${m.qty}`)
                .join('، ')}{' '}
              ({selectedTotal} ج.م)
            </div>
          )}
          <div>
            <strong className="text-primary">طريقة الدفع:</strong>{' '}
            {paymentMethod === 'vodafone'
              ? 'فودافون كاش (بانتظار المراجعة)'
              : 'كاش'}
          </div>
        </div>
        <button
          onClick={() => {
            setIsSubmitted(false);
            setBookingMeals((prev) => prev.map((m) => ({ ...m, qty: 0 })));
            setIsSubmitting(false);
          }}
          className="w-full bg-primary text-on-primary py-3 rounded-full font-label-sm hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
        >
          حجز جديد
        </button>
      </div>
    );
  }

  // ─── Main booking form + hero image ──────────────────────────────────────
  return (
    <>
      {/* Meal selection modal */}
      {isModalOpen && (
        <MealModal
          meals={bookingMeals}
          onQtyChange={handleMealQty}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter items-stretch rounded-2xl overflow-hidden border border-outline-variant/20 shadow-sm bg-surface-container-lowest">

        {/* ── Left panel: form ── */}
        <div className="p-8 md:p-12 flex flex-col justify-center text-right">
          <span className="text-sm font-semibold text-primary uppercase tracking-wide mb-2 block">
            حجز طاولة
          </span>
          <h2 className="font-display-lg text-primary text-2xl md:text-3xl mb-6">
            عِش تجربة المذاق الشامي الفاخر
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* ── Name ── */}
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-1">
                الاسم بالكامل
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أحمد السوري"
                className="w-full px-4 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-right font-body-md"
              />
            </div>

            {/* ── Phone ── */}
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-1">
                رقم الهاتف
              </label>
              <input
                type="tel"
                required
                pattern="[0-9]+"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 01012345678"
                className="w-full px-4 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-right font-body-md"
              />
            </div>

            {/* ── Guests / Date / Time ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">
                  عدد الأفراد
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-xs font-bold font-sans text-right"
                >
                  <option value="1">فرد واحد</option>
                  <option value="2">فردين</option>
                  <option value="3">3 أفراد</option>
                  <option value="4">4 أفراد</option>
                  <option value="5">5 أفراد</option>
                  <option value="6">6 أفراد</option>
                  <option value="8">8 أفراد</option>
                  <option value="10">10+ أفراد</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">
                  التاريخ
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  min={minDate}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-xs font-bold text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">
                  الوقت
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-xs font-bold text-right"
                />
              </div>
            </div>

            {/* ── Branch ── */}
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-1">
                الفرع المفضل
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-on-surface outline-none font-bold text-xs font-sans text-right"
              >
                <option value="main">الفرع الرئيسي (دمنهور - شارع المحافظة)</option>
                <option value="rahabat">فرع الراهبات (شارع الراهبات)</option>
              </select>
            </div>

            {/* ── Pre-order meals — modal trigger / summary card ── */}
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">
                وجبات مع الحجز (اختياري)
              </label>

              {selectedCount === 0 ? (
                /* Trigger button — no items selected yet */
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="w-full flex flex-row-reverse items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer font-bold text-sm font-sans"
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: '"FILL" 0' }}
                  >
                    restaurant_menu
                  </span>
                  تصفح قائمة الطعام وإضافة وجبات (اختياري)
                </button>
              ) : (
                /* Summary card — items selected */
                <div className="flex flex-row-reverse items-center justify-between gap-3 px-4 py-3 rounded-lg border border-primary/40 bg-primary/5">
                  <div className="flex flex-row-reverse items-center gap-2 text-right">
                    <span
                      className="material-symbols-outlined text-primary text-xl shrink-0"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      check_circle
                    </span>
                    <div>
                      <p className="font-bold text-sm text-on-surface">
                        تم اختيار {selectedCount}{' '}
                        {selectedCount === 1 ? 'صنف' : 'أصناف'}
                      </p>
                      <p className="text-xs text-primary font-bold font-sans">
                        إجمالي: {selectedTotal} ج.م
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/40 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-all cursor-pointer font-sans shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    تعديل الطلب
                  </button>
                </div>
              )}
            </div>

            {/* ── Payment method ── */}
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-1">
                طريقة دفع قيمة الحجز والوجبات
              </label>
              <div className="grid grid-cols-2 gap-3 mb-2 font-sans">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 rounded border font-bold text-xs transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  الدفع كاش بالمطعم
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('vodafone')}
                  className={`py-2 rounded border font-bold text-xs transition-all cursor-pointer ${
                    paymentMethod === 'vodafone'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  فودافون كاش (تحويل مسبق)
                </button>
              </div>

              {paymentMethod === 'vodafone' && (
                <div className="flex flex-col gap-2 border border-dashed border-outline-variant/50 p-3 rounded-lg bg-surface-container-low animate-fade-in text-xs font-sans text-right">
                  <span className="font-semibold text-on-surface-variant block">
                    الرجاء التحويل إلى الرقم:{' '}
                    <strong className="text-primary font-mono select-all">
                      01004354228
                    </strong>
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    ارفق صورة التحويل لتسهيل وتأكيد المراجعة:
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-xs text-on-surface cursor-pointer"
                  />
                  {screenshotUrl && (
                    <div className="mt-2 relative w-20 h-20 border border-outline-variant/40 rounded overflow-hidden">
                      <img
                        src={screenshotUrl}
                        alt="Vodafone Cash Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 w-full bg-primary text-on-primary py-3.5 rounded-full font-bold hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 scale-95 active:scale-100 cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-xl">event_seat</span>
              {isSubmitting ? 'جاري إرسال طلب الحجز...' : 'تأكيد حجز الطاولة'}
            </button>
          </form>
        </div>

        {/* ── Right panel: restaurant photo + live availability badge ── */}
        <div className="relative min-h-[300px] lg:min-h-full">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800"
            alt="Demashki Interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
          <div className="absolute top-6 right-6">
            <span className="bg-black/75 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-white/20 shadow-md font-sans">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse inline-block" />
              {emptyTablesCount > 0
                ? `المتاح الآن: ${emptyTablesCount} ${emptyTablesCount === 1 ? 'طاولة' : 'طاولات'}`
                : 'لا توجد طاولات متاحة حالياً'}
            </span>
          </div>
        </div>

      </div>
    </>
  );
}
