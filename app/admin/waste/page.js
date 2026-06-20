'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';

export default function AdminWastePage() {
  const {
    adminRole,
    adminBranch,
    wasteLogs,
    setWasteLogs,
    showToast,
    branches,
  } = useAppContext();

  const currentRole = adminRole;
  const activeBranch = adminBranch;

  // ── Local form states ──
  const [selectedBranch, setSelectedBranch] = useState(
    currentRole === 'super_admin' ? 'all' : activeBranch
  );
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('سوء تخزين');
  const [lossValue, setLossValue] = useState('');

  // ══════════════════════════════════════════════════════════════════
  // RBAC Security: Cashier Access Denied
  // ══════════════════════════════════════════════════════════════════
  if (currentRole === 'cashier') {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low rounded-2xl border border-error/20 text-center animate-fade-in gap-4">
        <span className="material-symbols-outlined text-6xl text-error">
          security
        </span>
        <h2 className="text-xl font-bold text-error">حظر الوصول</h2>
        <p className="text-sm text-on-surface-variant max-w-md">
          🔐 تم حجب نظام مراقبة وإهلاك الهالك عن الكاشير.
        </p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // Handlers
  // ══════════════════════════════════════════════════════════════════
  const handleLogWaste = (e) => {
    e.preventDefault();
    if (itemName && quantity && lossValue) {
      const targetBranch = selectedBranch === 'all' ? (branches[0]?.code || 'main') : selectedBranch;
      const newLog = {
        id: wasteLogs.length + 1,
        branch: targetBranch,
        date: new Date().toISOString().split('T')[0],
        item: itemName,
        quantity: quantity,
        reason: reason,
        lossValue: parseFloat(lossValue),
      };
      setWasteLogs([newLog, ...wasteLogs]);
      setItemName('');
      setQuantity('');
      setLossValue('');
      showToast('تم تسجيل وإهلاك الهالك المطبخ بنجاح', 'success');
    }
  };

  const calculateBranchLosses = (br) =>
    wasteLogs
      .filter((w) => w.branch === br)
      .reduce((sum, w) => sum + w.lossValue, 0);

  // ── Filtered logs based on role & branch ──
  const filteredLogs = wasteLogs.filter((w) =>
    currentRole === 'super_admin'
      ? selectedBranch === 'all' || w.branch === selectedBranch
      : w.branch === activeBranch
  );

  return (
    <div className="flex flex-col gap-6 text-right animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary font-display-lg">
            نظام جرد وإهلاك الهالك (مراقب الهالك)
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            تسجيل الخسائر اليومية للمواد الغذائية والمخزون التالف
          </p>
        </div>

        {/* Super Admin branch filter */}
        {currentRole === 'super_admin' && (
          <div className="flex flex-row-reverse items-center gap-3">
            <span className="text-sm font-bold text-on-surface-variant">
              تصفية الفرع:
            </span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
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
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Form + Data Table Grid
         ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Waste Logging Form ── */}
        <form
          onSubmit={handleLogWaste}
          className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm flex flex-col gap-4"
        >
          <h3 className="font-bold text-primary text-base pb-2 border-b border-outline-variant/20">
            تسجيل هالك جديد
          </h3>

          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              اسم المادة / الصنف التالف
            </label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="مثال: طماطم، لحم شاورما، خبز صاج"
              className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Quantity + Loss Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">
                الكمية / الوزن
              </label>
              <input
                type="text"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="مثال: 5 كجم، 50 رغيف"
                className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">
                قيمة الخسارة المادية (ج.م)
              </label>
              <input
                type="number"
                required
                value={lossValue}
                onChange={(e) => setLossValue(e.target.value)}
                placeholder="مثال: 150"
                className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Reason Selector */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              سبب التلف والإهلاك
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold"
            >
              <option value="سوء تخزين">سوء تخزين / رطوبة</option>
              <option value="انتهاء الصلاحية">انتهاء الصلاحية</option>
              <option value="سوء تجهيز في المطبخ">
                سوء تجهيز في المطبخ / احتراق
              </option>
              <option value="تلف طبيعي">تلف طبيعي / انسكاب</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 rounded transition-all shadow-sm text-sm active:scale-90"
          >
            تسجيل وإهلاك الهالك
          </button>
        </form>

        {/* ── Waste Logs Data Table ── */}
        <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
          {/* Table Header with Cumulative Loss */}
          <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low flex flex-row-reverse justify-between items-center">
            <span className="font-bold text-primary text-base">
              سجل المواد التالفة والهالك
            </span>
            <span className="bg-red-100 text-error text-xs font-bold px-3 py-1 rounded-full font-mono">
              تراكمي الخسائر للفرع:{' '}
              {calculateBranchLosses(
                currentRole === 'super_admin' ? selectedBranch : activeBranch
              )}{' '}
              ج.م
            </span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="bg-surface-container text-on-surface font-bold border-b border-outline-variant/30">
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">الفرع</th>
                  <th className="p-3">الصنف</th>
                  <th className="p-3">الكمية</th>
                  <th className="p-3">السبب</th>
                  <th className="p-3 text-center">الخسارة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface-variant font-semibold">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-6 text-center text-gray-500"
                    >
                      لا توجد سجلات هالك نشطة.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-surface-container-low transition-colors"
                    >
                      <td className="p-3">{log.date}</td>
                      <td className="p-3 font-bold text-on-surface">
                        {branches?.find((b) => b.code === log.branch)?.name || log.branch}
                      </td>
                      <td className="p-3 font-bold text-primary">
                        {log.item}
                      </td>
                      <td className="p-3">{log.quantity}</td>
                      <td className="p-3 text-xs italic">{log.reason}</td>
                      <td className="p-3 text-center font-bold text-error font-mono">
                        {log.lossValue} ج.م
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
