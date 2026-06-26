'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

export default function AdminShifts() {
  const {
    adminRole,
    adminBranch,
    showToast,
    pastShifts,
    setPastShifts,
    orders,
    branches,
  } = useAppContext();

  const [shiftState, setShiftState] = useState({
    isOpen: false,
    openingCash: 0,
    cashierName: '',
    startTime: '',
  });

  const [closingCashInput, setClosingCashInput] = useState('');
  const [isShiftJustClosed, setIsShiftJustClosed] = useState(false);
  const [discrepancy, setDiscrepancy] = useState(0);
  const [closingSummary, setClosingSummary] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "إدارة الورديات | دمشقي أدمن";
  }, []);

  // Dynamic Shift Reconciliation Engine: slice active branch orders
  const expectedSales = orders
    .filter(
      (o) =>
        (adminBranch === 'all' || o.branch === adminBranch) && o.status !== 'ملغى'
    )
    .reduce((sum, o) => sum + o.total, 0);

  const handleOpenShift = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const startCash = parseFloat(e.target.openingCashInput.value) || 0;
    setShiftState({
      isOpen: true,
      openingCash: startCash,
      cashierName: adminRole === 'super_admin' ? 'المدير العام' : 'كاشير مناوب',
      startTime: new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
    setIsShiftJustClosed(false);
    setClosingSummary(null);
    setClosingCashInput('');
    setIsSubmitting(false);
    showToast('تم فتح وردية صندوق جديدة بنجاح', 'success');
  };

  const handleCloseShift = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const counted = parseFloat(closingCashInput) || 0;
    const expectedTotal = shiftState.openingCash + expectedSales;
    const diff = counted - expectedTotal;

    setDiscrepancy(diff);
    setClosingSummary({
      opening: shiftState.openingCash,
      sales: expectedSales,
      expected: expectedTotal,
      actual: counted,
      diff: diff,
    });

    const newPastShift = {
      id: pastShifts.length + 100,
      date: new Date().toISOString().split('T')[0],
      cashier: shiftState.cashierName,
      branch: adminBranch === 'all' ? 'main' : adminBranch,
      openCash: shiftState.openingCash,
      closeCash: counted,
      sales: expectedSales,
      discrepancy: diff,
      status: diff === 0 ? 'متطابق' : diff < 0 ? 'عجز' : 'زيادة',
    };
    setPastShifts([newPastShift, ...pastShifts]);
    setShiftState({ ...shiftState, isOpen: false });
    setIsShiftJustClosed(true);
    setIsSubmitting(false);

    if (diff === 0) {
      showToast('تم إغلاق الوردية بمطابقة كاش كاملة!', 'success');
    } else {
      showToast('تم إغلاق الوردية بوجود فروقات كاش مسجلة: ' + diff + ' ج.م', 'error');
    }
  };

  const filteredShifts = pastShifts.filter(
    (s) => adminBranch === 'all' || s.branch === adminBranch
  );

  return (
    <div className="flex flex-col gap-6 text-right animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl font-bold text-primary font-display-lg">إدارة ورديات الصندوق</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          التحكم في بدء ونهاية وردية الكاشير ومطابقة الحسابات اليومية
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm">
          {shiftState.isOpen ? (
            <div className="flex flex-col gap-5 font-sans">
              <div className="pb-3 border-b border-outline-variant/20 flex flex-row-reverse justify-between items-center">
                <h3 className="font-bold text-primary text-base">الوردية الحالية نشطة</h3>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                  مفتوحة
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-on-surface-variant font-sans">
                <div className="bg-surface-container p-3 rounded">
                  <span className="block text-[10px] opacity-75">أمين الصندوق</span>
                  <span className="text-sm text-on-surface mt-1 block">{shiftState.cashierName}</span>
                </div>
                <div className="bg-surface-container p-3 rounded">
                  <span className="block text-[10px] opacity-75">وقت الافتتاح</span>
                  <span className="text-sm text-on-surface mt-1 block">{shiftState.startTime}</span>
                </div>
                <div className="bg-surface-container p-3 rounded">
                  <span className="block text-[10px] opacity-75">العهدة الافتتاحية</span>
                  <span className="text-sm text-primary mt-1 block">{shiftState.openingCash} ج.م</span>
                </div>
                <div className="bg-surface-container p-3 rounded font-sans">
                  <span className="block text-[10px] opacity-75">مبيعات الوردية (تقديري نشط)</span>
                  <span className="text-sm text-on-surface mt-1 block">{expectedSales} ج.م</span>
                </div>
              </div>

              <form onSubmit={handleCloseShift} className="border-t border-outline-variant/20 pt-4 flex flex-col gap-3 font-sans">
                <h4 className="font-bold text-sm text-on-surface">إغلاق الوردية والعد الفعلي</h4>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 font-semibold">
                    المبلغ الفعلي في الدرج (ج.م)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={closingCashInput}
                    onChange={(e) => setClosingCashInput(e.target.value)}
                    placeholder="أدخل المبلغ بعد العد اليدوي"
                    className="w-full px-3 py-2 border border-outline-variant/60 rounded bg-surface text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-2 rounded transition-all shadow-sm text-sm scale-95 active:scale-100 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'إغلاق الوردية ومطابقة الكاش'}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-4 font-sans">
              <div className="pb-3 border-b border-outline-variant/20 flex flex-row-reverse justify-between items-center">
                <h3 className="font-bold text-primary">بدء وردية جديدة</h3>
                <span className="bg-secondary-container text-on-secondary-container text-xs font-bold px-2.5 py-1 rounded-full font-sans font-bold">
                  مغلقة
                </span>
              </div>

              {isShiftJustClosed && closingSummary && (
                <div className="bg-surface-container p-4 rounded-lg flex flex-col gap-2.5 text-xs animate-fade-in font-sans">
                  <h4 className="font-bold text-primary text-sm mb-1 font-sans">ملخص الإغلاق الأخير:</h4>
                  <div className="flex flex-row-reverse justify-between">
                    <span>العهدة الافتتاحية:</span>
                    <span className="font-semibold">{closingSummary.opening} ج.م</span>
                  </div>
                  <div className="flex flex-row-reverse justify-between">
                    <span>إجمالي المبيعات:</span>
                    <span className="font-semibold">{closingSummary.sales} ج.م</span>
                  </div>
                  <div className="flex flex-row-reverse justify-between border-t border-outline-variant/20 pt-2 font-bold text-on-surface">
                    <span>الكاش المتوقع:</span>
                    <span>{closingSummary.expected}.00 ج.م</span>
                  </div>
                  <div className="flex flex-row-reverse justify-between font-bold text-on-surface">
                    <span>الكاش الفعلي المقبوض:</span>
                    <span>{closingSummary.actual}.00 ج.م</span>
                  </div>

                  <div
                    className={`mt-2 p-3 rounded text-center text-sm font-bold flex items-center justify-center gap-1 ${
                      closingSummary.diff === 0
                        ? 'bg-green-100 text-green-800'
                        : closingSummary.diff < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {closingSummary.diff === 0 ? 'check_circle' : 'warning'}
                    </span>
                    {closingSummary.diff === 0 && 'الكاش متطابق تماماً'}
                    {closingSummary.diff < 0 && `عجز كاش بقيمة ${Math.abs(closingSummary.diff)} ج.م`}
                    {closingSummary.diff > 0 && `زيادة كاش بقيمة ${closingSummary.diff} ج.م`}
                  </div>
                </div>
              )}

              <form onSubmit={handleOpenShift} className="flex flex-col gap-3 font-sans">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 font-semibold">
                    عهدة صندوق البداية (الافتتاحية)
                  </label>
                  <input
                    type="number"
                    name="openingCashInput"
                    defaultValue="1000"
                    min="0"
                    placeholder="مثال: 1000"
                    className="w-full px-3 py-2 border border-outline-variant/60 rounded bg-surface text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-2 rounded transition-all shadow-sm text-sm scale-95 active:scale-100 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'جاري البدء...' : 'افتتاح وردية جديدة'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low font-bold text-primary text-base">
            سجل الورديات السابقة
          </div>
          <div className="overflow-x-auto text-xs font-sans">
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="bg-surface-container text-on-surface font-bold border-b border-outline-variant/30">
                  <th className="p-3">رقم الوردية</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">الكاشير</th>
                  <th className="p-3">فرع</th>
                  <th className="p-3 text-center">العهدة</th>
                  <th className="p-3 text-center">المبيعات</th>
                  <th className="p-3 text-center">إغلاق</th>
                  <th className="p-3 text-center">المطابقة / الفارق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-semibold text-on-surface-variant">
                {filteredShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="p-3 font-mono text-primary font-bold">#{shift.id}</td>
                    <td className="p-3">{shift.date}</td>
                    <td className="p-3 font-bold text-on-surface">{shift.cashier}</td>
                    <td className="p-3">{branches?.find(b => b.code === shift.branch)?.name || shift.branch}</td>
                    <td className="p-3 text-center font-mono">{shift.openCash} ج.م</td>
                    <td className="p-3 text-center font-mono">{shift.sales} ج.م</td>
                    <td className="p-3 text-center font-mono">{shift.closeCash} ج.م</td>
                    <td className="p-3 text-center">
                      {shift.discrepancy === 0 && (
                        <span className="inline-block bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-bold">
                          متطابق
                        </span>
                      )}
                      {shift.discrepancy < 0 && (
                        <span className="inline-block bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold">
                          عجز ({shift.discrepancy} ج.م)
                        </span>
                      )}
                      {shift.discrepancy > 0 && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold">
                          زيادة (+{shift.discrepancy} ج.م)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
