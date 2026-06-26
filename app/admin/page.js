'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { playErrorBuzz } from '@/utils/audio';

export default function AdminDashboardPage() {
  const {
    adminRole,
    adminBranch,
    setAdminBranch,
    orders,
    wasteLogs,
    pastShifts,
    branches,
    showToast,
  } = useAppContext();

  const currentRole = adminRole;
  const activeBranch = adminBranch;
  const router = useRouter();

  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    document.title = "لوحة الإحصائيات | دمشقي أدمن";
  }, []);

  useEffect(() => {
    if (adminRole === 'cashier') {
      playErrorBuzz();
      showToast('غير مصرح لك بدخول لوحة الإحصائيات والبيانات المالية الحساسة.', 'error');
      router.push('/admin/orders');
    }
  }, [adminRole, router, showToast]);

  const handleExportCSV = () => {
    const filteredOrders = orders.filter(
      (o) => activeBranch === 'all' || o.branch === activeBranch
    );

    const headers = ['رقم الطلب', 'العميل', 'الطلبات', 'الإجمالي', 'التاريخ', 'الفرع'];
    const rows = filteredOrders.map((o) => {
      const branchName = o.branch === 'rahabat' ? 'فرع الراهبات' : 'الفرع الرئيسي';
      const cleanItems = `"${(o.items || '').replace(/"/g, '""')}"`;
      const cleanCustomer = `"${(o.customer || '').replace(/"/g, '""')}"`;
      const cleanDate = `"${(o.date || '').replace(/"/g, '""')}"`;
      return [
        o.id || '',
        cleanCustomer,
        cleanItems,
        o.total || 0,
        cleanDate,
        branchName
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'demashki_daily_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ══════════════════════════════════════════════════════════════════
  // RBAC Security: Strict Financial Lockdown for Cashier
  // ══════════════════════════════════════════════════════════════════
  if (currentRole === 'cashier') {
    return null;
  }

  // ══════════════════════════════════════════════════════════════════
  // Aggregation Calculators
  // ══════════════════════════════════════════════════════════════════
  const calculateBranchRevenue = (br) =>
    orders
      .filter((o) => br === 'all' || o.branch === br)
      .reduce((sum, o) => sum + (o.status !== 'ملغى' ? o.total : 0), 0);

  const calculateBranchWaste = (br) =>
    wasteLogs
      .filter((w) => br === 'all' || w.branch === br)
      .reduce((sum, w) => sum + w.lossValue, 0);

  const calculateBranchDrift = (br) =>
    pastShifts
      .filter((s) => br === 'all' || s.branch === br)
      .reduce((sum, s) => sum + s.discrepancy, 0);

  const calculateCompletedOrdersCount = (br) =>
    orders.filter(
      (o) => (br === 'all' || o.branch === br) && o.status !== 'ملغى'
    ).length;

  const revenue = calculateBranchRevenue(activeBranch);
  const completedCount = calculateCompletedOrdersCount(activeBranch);
  const wasteLosses = calculateBranchWaste(activeBranch);
  const cancelledCount = orders.filter(
    (o) => (activeBranch === 'all' || o.branch === activeBranch) && o.status === 'ملغى'
  ).length;

  // Calculate dynamic Category breakdown from branch-specific orders
  const filteredOrdersForBreakdown = orders.filter(
    (o) => (activeBranch === 'all' || o.branch === activeBranch) && o.status !== 'ملغى'
  );

  const categoryMap = {};
  filteredOrdersForBreakdown.forEach((o) => {
    if (!o.items || o.items === 'حجز طاولة فقط') return;
    const parts = o.items.split('+');
    parts.forEach((p) => {
      const match = p.match(/(.*?)\s*\((\d+)\)/);
      const name = match ? match[1].trim() : p.trim();
      const qty = match ? parseInt(match[2]) || 1 : 1;

      let category = 'وجبات وإضافات أخرى';
      if (name.includes('شاورما') || name.includes('ساندوتش')) {
        category = 'شاورما دجاج ولحم';
      } else if (name.includes('مشوي') || name.includes('كباب') || name.includes('مقبلات') || name.includes('شيش')) {
        category = 'مشويات ومقبلات';
      } else if (name.includes('مشروب') || name.includes('كولا') || name.includes('عصير') || name.includes('حلى') || name.includes('حلويات') || name.includes('ثومية')) {
        category = 'مشروبات وحلويات';
      }

      categoryMap[category] = (categoryMap[category] || 0) + qty;
    });
  });

  const totalItemsSold = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);
  const categoriesList = Object.keys(categoryMap).map((catName) => {
    const qty = categoryMap[catName];
    const pct = totalItemsSold > 0 ? Math.round((qty / totalItemsSold) * 100) : 0;
    return { name: catName, qty, pct };
  }).sort((a, b) => b.qty - a.qty);

  const topCategory = categoriesList.length > 0 ? categoriesList[0].name : 'لا توجد مبيعات بعد';

  // Dynamic Lounge Tables Capacity calculation
  const totalLoungeTables = activeBranch === 'all'
    ? (branches || []).reduce((sum, b) => sum + (b.tables || 0), 0)
    : (branches || []).find((b) => b.code === activeBranch)?.tables || 0;

  // Hourly Sales Trend calculation
  const getHourOfOrder = (order) => {
    if (!order.date) return 12;
    try {
      const d = new Date(order.date);
      if (!isNaN(d.getTime())) {
        return d.getHours();
      }
      let cleanDateStr = order.date
        .replace(/[٠-٩]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
        .replace(/ص/g, 'AM')
        .replace(/م/g, 'PM');
      
      const d2 = new Date(cleanDateStr);
      if (!isNaN(d2.getTime())) {
        return d2.getHours();
      }
      
      const match = cleanDateStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
      if (match) {
        let hr = parseInt(match[1]);
        const isPM = match[3]?.toUpperCase() === 'PM';
        if (isPM && hr < 12) hr += 12;
        if (!isPM && hr === 12) hr = 0;
        return hr;
      }
    } catch (e) {
      console.error(e);
    }
    return 12;
  };

  const bins = [0, 0, 0, 0, 0, 0, 0];
  filteredOrdersForBreakdown.forEach((o) => {
    const hour = getHourOfOrder(o);
    let binIdx = 0;
    if (hour >= 11 && hour < 13) binIdx = 0;
    else if (hour >= 13 && hour < 15) binIdx = 1;
    else if (hour >= 15 && hour < 17) binIdx = 2;
    else if (hour >= 17 && hour < 19) binIdx = 3;
    else if (hour >= 19 && hour < 21) binIdx = 4;
    else if (hour >= 21 && hour < 23) binIdx = 5;
    else binIdx = 6;
    
    bins[binIdx] += o.total || 0;
  });

  const maxBinVal = Math.max(...bins, 100);
  const xCoords = [40, 130, 220, 310, 400, 490, 580];
  const yCoords = xCoords.map((_, idx) => {
    if (completedCount === 0) return 190;
    return 190 - (bins[idx] / maxBinVal) * 150;
  });

  const linePathD = `M ${xCoords[0]} ${yCoords[0]} L ${xCoords[1]} ${yCoords[1]} L ${xCoords[2]} ${yCoords[2]} L ${xCoords[3]} ${yCoords[3]} L ${xCoords[4]} ${yCoords[4]} L ${xCoords[5]} ${yCoords[5]} L ${xCoords[6]} ${yCoords[6]}`;
  const gradPathD = `${linePathD} L 580 200 L 40 200 Z`;

  return (
    <div className="flex flex-col gap-6 text-right animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary font-display-lg">
            لوحة الإحصائيات والمؤشرات
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            متابعة المبيعات والنشاط اللحظي للفروع والصالة
          </p>
        </div>
        <div className="flex flex-row-reverse items-center gap-4">
          {/* Report Export Button (Super Admin Only) */}
          {currentRole === 'super_admin' && (
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="bg-primary hover:bg-primary-container text-white py-2 px-4 rounded-full font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              تحميل تقرير اليوم الإحصائي
            </button>
          )}

          {/* CSV Data Export Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-secondary-container hover:bg-outline-variant/30 text-primary py-2 px-4 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-90"
          >
            تصدير التقرير (CSV)
          </button>

          {/* Branch Filter (Super Admin = dropdown, Branch Manager = static badge) */}
          {currentRole === 'super_admin' ? (
            <div className="flex flex-row-reverse items-center gap-3">
              <span className="text-sm font-bold text-on-surface-variant">
                تصفية حسب الفرع:
              </span>
              <select
                value={activeBranch}
                onChange={(e) => setAdminBranch(e.target.value)}
                className="px-4 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-sm font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="all">كل الفروع</option>
                {branches && branches.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-surface-container-high border border-outline-variant/30 px-4 py-2 rounded-lg text-xs font-bold text-primary">
              الفرع النشط:{' '}
              {branches?.find((b) => b.code === activeBranch)?.name || activeBranch}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          KPI Cards Grid
         ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 animate-fade-in">
        {/* Card 1: Total Revenue */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-row-reverse items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-on-surface-variant mb-1">
              إجمالي المبيعات
            </span>
            <span className="text-xl font-bold text-primary">
              {revenue.toLocaleString('ar-EG')} ج.م
            </span>
            {revenue > 0 ? (
              <span className="block text-[10px] text-green-600 mt-1 font-bold">
                ▲ مبيعات نشطة اليوم
              </span>
            ) : (
              <span className="block text-[10px] text-on-surface-variant mt-1">
                لا توجد مبيعات مسجلة
              </span>
            )}
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
            <span className="material-symbols-outlined">payments</span>
          </div>
        </div>

        {/* Card 2: Completed Orders */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-row-reverse items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-on-surface-variant mb-1">
              الطلبـات المكتملة
            </span>
            <span className="text-xl font-bold text-on-surface">
              {completedCount} طلب
            </span>
            {completedCount > 0 ? (
              <span className="block text-[10px] text-green-600 mt-1 font-bold">
                ▲ طلبات مكتملة بنجاح
              </span>
            ) : (
              <span className="block text-[10px] text-on-surface-variant mt-1">
                لا توجد طلبات مكتملة
              </span>
            )}
          </div>
          <div className="p-3 bg-secondary-container text-on-secondary-container rounded-lg shrink-0">
            <span className="material-symbols-outlined">receipt_long</span>
          </div>
        </div>

        {/* Card 3: Average Invoice */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-row-reverse items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-on-surface-variant mb-1">
              متوسط قيمة الفاتورة
            </span>
            <span className="text-xl font-bold text-on-surface">
              {completedCount > 0
                ? Math.round(revenue / completedCount)
                : 0}{' '}
              ج.م
            </span>
            <span className="block text-[10px] text-on-surface-variant mt-1">
              {completedCount > 0 ? 'معدل شراء ممتاز' : 'لا توجد طلبات مكتملة'}
            </span>
          </div>
          <div className="p-3 bg-outline-variant/20 text-on-surface-variant rounded-lg shrink-0">
            <span className="material-symbols-outlined">shopping_bag</span>
          </div>
        </div>

        {/* Card 4: Waste Losses */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-row-reverse items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-on-surface-variant mb-1">
              خسائر الهالك المالي
            </span>
            <span className="text-xl font-bold text-error">
              {wasteLosses.toLocaleString('ar-EG')} ج.م
            </span>
            <span className="block text-[10px] text-on-surface-variant mt-1">
              {wasteLosses > 0 ? 'مراقبة الهالك اليومي' : 'لا يوجد هالك مسجل'}
            </span>
          </div>
          <div className="p-3 bg-red-100 text-error rounded-lg shrink-0">
            <span className="material-symbols-outlined">delete_sweep</span>
          </div>
        </div>

        {/* Card 5: Lounge Tables Capacity */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-row-reverse items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-on-surface-variant mb-1">
              طاولات الصالة المهيأة
            </span>
            <span className="text-xl font-bold text-on-surface font-sans">
              {totalLoungeTables} {totalLoungeTables === 1 ? 'طاولة' : 'طاولات'}
            </span>
            <span className="block text-[10px] text-on-surface-variant mt-1">
              طاقة استيعاب الصالة للفروع
            </span>
          </div>
          <div className="p-3 bg-secondary-container text-on-secondary-container rounded-lg shrink-0">
            <span className="material-symbols-outlined">table_restaurant</span>
          </div>
        </div>

        {/* Card 6: Cancelled Orders */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-row-reverse items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-on-surface-variant mb-1">
              الطلبات الملغاة اليوم
            </span>
            <span className="text-xl font-bold text-error font-sans">
              {cancelledCount} {cancelledCount === 1 ? 'طلب' : 'طلبات'}
            </span>
            <span className="block text-[10px] text-on-surface-variant mt-1">
              {cancelledCount > 0 ? 'معدل تشغيل طبيعي' : 'لا توجد طلبات ملغاة'}
            </span>
          </div>
          <div className="p-3 bg-error-container text-on-error-container rounded-lg shrink-0">
            <span className="material-symbols-outlined">cancel</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Sales Trend Chart + Category Breakdown
         ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        {/* SVG Sales Trend Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm">
          <div className="flex flex-row-reverse justify-between items-center mb-6">
            <h3 className="font-bold text-primary text-base">
              مخطط المبيعات اليومي (بالساعة)
            </h3>
            <span className="text-xs text-on-surface-variant">
              محدث تلقائياً
            </span>
          </div>

          <div className="h-64 w-full relative flex flex-col items-center justify-center">
            <svg
              className="w-full h-full"
              viewBox="0 0 600 240"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b0000" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#8b0000" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="40" x2="580" y2="40" stroke="#f0eded" strokeWidth="1" />
              <line x1="40" y1="90" x2="580" y2="90" stroke="#f0eded" strokeWidth="1" />
              <line x1="40" y1="140" x2="580" y2="140" stroke="#f0eded" strokeWidth="1" />
              <line x1="40" y1="190" x2="580" y2="190" stroke="#f0eded" strokeWidth="1" />

              {/* Trend Line */}
              <path
                d={linePathD}
                fill="none"
                stroke="#8b0000"
                strokeWidth="3"
              />

              {/* Gradient Fill */}
              {completedCount > 0 && (
                <path
                  d={gradPathD}
                  fill="url(#chartGrad)"
                />
              )}

              {/* Data Points */}
              {xCoords.map((x, idx) => (
                <circle key={x} cx={x} cy={yCoords[idx]} r="5" fill="#8b0000" />
              ))}
            </svg>

            <div className="flex flex-row-reverse justify-between text-[10px] text-on-surface-variant px-10 mt-2 font-bold w-full">
              <span>12 م</span>
              <span>2 م</span>
              <span>4 م</span>
              <span>6 م</span>
              <span>8 م</span>
              <span>10 م</span>
              <span>12 ص</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Panel */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-primary text-base">
              الأقسام الأكثر مبيعاً
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              {totalItemsSold > 0 ? 'نسبة مبيعات الأصناف اليومية' : 'بانتظار الطلبات'}
            </p>
          </div>

          {totalItemsSold === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant gap-2 select-none">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">inventory_2</span>
              <span className="text-sm font-bold text-on-surface-variant/80">
                لا توجد مبيعات مسجلة اليوم بعد
              </span>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {categoriesList.map((cat, index) => {
                  const colors = ['bg-primary', 'bg-outline', 'bg-tertiary-fixed-dim', 'bg-secondary'];
                  const barColor = colors[index % colors.length];
                  return (
                    <div key={cat.name}>
                      <div className="flex flex-row-reverse justify-between text-xs font-bold mb-1">
                        <span>{cat.name}</span>
                        <span>{cat.pct}%</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div
                          className={`${barColor} h-full rounded-full transition-all duration-700`}
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-outline-variant/20 pt-4 mt-4 text-xs text-center text-on-surface-variant font-semibold">
                التصنيف الأقوى:{' '}
                <span className="text-primary font-bold">{topCategory}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Premium Administrative Financial Report Modal
         ══════════════════════════════════════════════════════════════ */}
      {showReportModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black p-8 rounded-2xl w-full max-w-3xl border border-outline-variant shadow-2xl flex flex-col text-right relative">
            {/* Close */}
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 left-4 text-gray-500 hover:text-black"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Report Header */}
            <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-gray-400">
              <h2 className="text-primary text-2xl font-bold font-display-lg">
                التقرير المالي والإحصائي اليومي للمطعم
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                تاريخ التصدير: {new Date().toLocaleString('ar-EG')}
              </p>
            </div>

            {/* Summary KPI Grid */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
                <span className="text-xs text-gray-500 font-bold block">
                  إجمالي مبيعات الفروع
                </span>
                <span className="text-lg font-bold text-primary mt-1 block">
                  {calculateBranchRevenue('all')} ج.م
                </span>
              </div>
              <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
                <span className="text-xs text-gray-500 font-bold block">
                  خسائر الهالك الكلية
                </span>
                <span className="text-lg font-bold text-error mt-1 block">
                  {calculateBranchWaste('all')} ج.م
                </span>
              </div>
              <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
                <span className="text-xs text-gray-500 font-bold block">
                  فروقات الصندوق (الوردية)
                </span>
                <span className="text-lg font-bold text-amber-600 mt-1 block">
                  {calculateBranchDrift('all')} ج.م
                </span>
              </div>
            </div>

            {/* Branch Detailed Sales Table */}
            <div className="mb-6">
              <h3 className="font-bold text-sm text-primary mb-3 pb-1 border-b border-gray-200">
                مبيعات الفروع المفصلة
              </h3>
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 font-bold">
                    <th className="p-2">الفرع</th>
                    <th className="p-2 text-center">عدد الطلبات الناجحة</th>
                    <th className="p-2 text-center">المبيعات</th>
                    <th className="p-2 text-center">خسائر الهالك</th>
                    <th className="p-2 text-center">صافي الأداء المالي</th>
                  </tr>
                </thead>
                <tbody>
                  {branches && branches.map((b) => (
                    <tr key={b.code} className="border-b border-gray-200">
                      <td className="p-2 font-bold">{b.name}</td>
                      <td className="p-2 text-center font-mono">
                        {calculateCompletedOrdersCount(b.code)}
                      </td>
                      <td className="p-2 text-center font-mono">
                        {calculateBranchRevenue(b.code)} ج.م
                      </td>
                      <td className="p-2 text-center font-mono">
                        {calculateBranchWaste(b.code)} ج.م
                      </td>
                      <td className="p-2 text-center font-bold font-mono">
                        {calculateBranchRevenue(b.code) - calculateBranchWaste(b.code)} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cash Reconciliation / Shift Drift Table */}
            <div className="mb-6">
              <h3 className="font-bold text-sm text-primary mb-3 pb-1 border-b border-gray-200">
                مطابقة الكاش وفروقات الورديات
              </h3>
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 font-bold">
                    <th className="p-2">رقم الوردية</th>
                    <th className="p-2">الكاشير المسؤول</th>
                    <th className="p-2">الفرع</th>
                    <th className="p-2 text-center">الكاش المتوقع</th>
                    <th className="p-2 text-center">الكاش الفعلي</th>
                    <th className="p-2 text-center">
                      قيمة الفارق / العجز
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pastShifts.map((shift) => (
                    <tr key={shift.id} className="border-b border-gray-200">
                      <td className="p-2 font-mono">#{shift.id}</td>
                      <td className="p-2 font-bold">{shift.cashier}</td>
                      <td className="p-2">
                        {branches?.find((b) => b.code === shift.branch)?.name || shift.branch}
                      </td>
                      <td className="p-2 text-center font-mono">
                        {shift.openCash + shift.sales} ج.م
                      </td>
                      <td className="p-2 text-center font-mono">
                        {shift.closeCash} ج.م
                      </td>
                      <td
                        className={`p-2 text-center font-bold font-mono ${
                          shift.discrepancy < 0
                            ? 'text-error'
                            : shift.discrepancy > 0
                            ? 'text-blue-600'
                            : 'text-green-600'
                        }`}
                      >
                        {shift.discrepancy} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-gray-400 mt-4 border-t border-gray-200 pt-4">
              تم التوليد بنجاح من لوحة تحكم دمشقي ERP. سري وللاستخدام
              الداخلي فقط.
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-xs hover:bg-primary-container transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">
                  print
                </span>
                تأكيد وطباعة التقرير
              </button>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-bold text-xs hover:bg-gray-300 transition-all text-center"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
