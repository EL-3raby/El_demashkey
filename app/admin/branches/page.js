'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { playTapFeedback, playErrorBuzz, playChime } from '@/utils/audio';

export default function AdminBranchesPage() {
  const {
    pastShifts,
    setPastShifts,
    orders,
    showToast,
    adminRole,
    branches,
    setBranches,
  } = useAppContext();

  const router = useRouter();

  // Modals Visibility State
  const [selectedShiftBranch, setSelectedShiftBranch] = useState(null);
  const [selectedAssetBranch, setSelectedAssetBranch] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "إدارة الفروع | دمشقي أدمن";
  }, []);

  useEffect(() => {
    if (adminRole !== 'super_admin') {
      playErrorBuzz();
      showToast('غير مصرح لك بدخول صفحة إدارة الفروع.', 'error');
      router.push('/admin/orders');
    }
  }, [adminRole, router, showToast]);

  if (adminRole !== 'super_admin') {
    return null;
  }

  // Forms Input State
  const [declaredCash, setDeclaredCash] = useState('');
  const [editManager, setEditManager] = useState('');
  const [editTables, setEditTables] = useState('');

  // Create Branch Form State
  const [createName, setCreateName] = useState('');
  const [createLocation, setCreateLocation] = useState('');
  const [createManager, setCreateManager] = useState('');
  const [createTables, setCreateTables] = useState('');

  // Live order tracker ref to prevent loop triggers on initial load
  const prevOrderCountRef = useRef(orders.length);

  // Background Cross-Page Live Synchronization Effect
  useEffect(() => {
    if (orders.length > prevOrderCountRef.current) {
      const newOrder = orders[0]; // Assuming new orders are prepended
      if (newOrder) {
        // Force background chime and alert
        playChime();
        showToast(
          `تنبيه تشغيل: طلب جديد وارد لفرع (${
            newOrder.branch === 'main' ? 'الرئيسي' : 'الراهبات'
          }) - العميل: ${newOrder.customer} بقيمة ${newOrder.total} ج.م`,
          'success'
        );
      }
    }
    prevOrderCountRef.current = orders.length;
  }, [orders, showToast]);

  // Open Shift Details Modal
  const openShiftModal = (branch) => {
    setSelectedShiftBranch(branch);
    setDeclaredCash('');
    playTapFeedback();
  };

  // Open Edit Assets Modal
  const openAssetModal = (branch) => {
    setSelectedAssetBranch(branch);
    setEditManager(branch.manager);
    setEditTables(branch.tables);
    playTapFeedback();
  };

  // Handle Edit Assets Submit
  const handleEditAssets = (e) => {
    e.preventDefault();
    if (!editManager.trim() || !editTables) {
      playErrorBuzz();
      showToast('الرجاء ملء جميع حقول الأصول بشكل صحيح', 'error');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const updatedBranches = branches.map((b) => {
      if (b.code === selectedAssetBranch.code) {
        return {
          ...b,
          manager: editManager.trim(),
          tables: parseInt(editTables) || 0,
        };
      }
      return b;
    });

    setBranches(updatedBranches);
    setSelectedAssetBranch(null);
    setIsSubmitting(false);
    playTapFeedback();
    showToast('تم تحديث أصول الفرع بنجاح!', 'success');
  };

  // Handle Shift Closure / Cash Drop Reconciliation
  const handleCloseShift = (e) => {
    e.preventDefault();
    const counted = parseFloat(declaredCash);
    if (isNaN(counted) || counted < 0) {
      playErrorBuzz();
      showToast('الرجاء إدخال مبلغ عهدة فعلي صحيح', 'error');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const b = selectedShiftBranch;
    // Calculate expected sales from completed/active orders of this branch
    const branchSales = orders
      .filter((o) => o.branch === b.code && o.status !== 'ملغى')
      .reduce((sum, o) => sum + o.total, 0);

    const expectedTotal = b.openingCash + branchSales;
    const diff = counted - expectedTotal;

    // Create dynamic reconciliation log
    const newPastShift = {
      id: pastShifts.length + 100,
      date: new Date().toISOString().split('T')[0],
      cashier: b.manager,
      branch: b.code,
      openCash: b.openingCash,
      closeCash: counted,
      sales: branchSales,
      discrepancy: diff,
      status: diff === 0 ? 'متطابق' : diff < 0 ? 'عجز' : 'زيادة',
    };

    setPastShifts([newPastShift, ...pastShifts]);
    setSelectedShiftBranch(null);
    setIsSubmitting(false);
    playTapFeedback();

    if (diff === 0) {
      showToast('تم إغلاق الوردية ومطابقة صندوق الكاش بنجاح تام!', 'success');
    } else if (diff > 0) {
      showToast(`تم إغلاق الوردية بزيادة مالية قدرها +${diff} ج.م`, 'success');
    } else {
      showToast(`تم تسجيل عجز مالي في الخزينة بقيمة ${diff} ج.م`, 'error');
    }
  };

  // Handle Create New Branch Submit
  const handleCreateBranch = (e) => {
    e.preventDefault();
    if (!createName.trim() || !createLocation.trim() || !createManager.trim() || !createTables) {
      playErrorBuzz();
      showToast('الرجاء ملء جميع الحقول بشكل صحيح', 'error');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const newCode = 'branch_' + Math.random().toString(36).substring(2, 7);
    const newBranch = {
      name: createName.trim(),
      code: newCode,
      location: createLocation.trim(),
      tables: parseInt(createTables) || 0,
      status: 'نشط',
      manager: createManager.trim(),
      openingCash: 0,
    };

    setBranches([...branches, newBranch]);

    // reset form fields
    setCreateName('');
    setCreateLocation('');
    setCreateManager('');
    setCreateTables('');

    setShowCreateModal(false);
    setIsSubmitting(false);
    playTapFeedback();
    showToast("تم تأسيس وإضافة الفرع الجديد بنجاح!", "success");
  };

  return (
    <div className="flex flex-col gap-6 text-right animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary font-display-lg">إدارة وهيكلة فروع دمشقي</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            مراقبة وتعديل أصول الفروع، وتسوية الورديات المالية بصورة لحظية
          </p>
        </div>
        {adminRole === 'super_admin' && (
          <button
            type="button"
            onClick={() => {
              setShowCreateModal(true);
              playTapFeedback();
            }}
            className="self-start sm:self-auto bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 px-6 rounded-full shadow-md scale-95 hover:scale-100 active:scale-90 transition-all duration-300 cursor-pointer border-none text-sm font-sans"
          >
            + إضافة فرع جديد
          </button>
        )}
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map((b) => {
          // Calculate dynamic live revenues for dashboard preview
          const branchSales = orders
            .filter((o) => o.branch === b.code && o.status !== 'ملغى')
            .reduce((sum, o) => sum + o.total, 0);

          return (
            <div
              key={b.code}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300"
            >
              <div>
                <div className="flex flex-row-reverse justify-between items-center mb-4">
                  <h3 className="font-bold text-primary text-lg">{b.name}</h3>
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full font-sans">
                    {b.status}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5 text-xs font-semibold text-on-surface-variant border-t border-outline-variant/10 pt-4">
                  <div>
                    <strong className="text-primary">الموقع والجغرافيا:</strong> {b.location}
                  </div>
                  <div>
                    <strong className="text-primary">إجمالي الطاولات المهيأة:</strong> {b.tables} طاولات صالة
                  </div>
                  <div>
                    <strong className="text-primary">المدير المسؤول:</strong> {b.manager}
                  </div>
                  <div>
                    <strong className="text-primary font-sans">المبيعات الحالية للوردية:</strong>{' '}
                    <span className="text-green-700 font-bold font-mono">{branchSales.toLocaleString()} ج.م</span>
                  </div>
                  <div>
                    <strong className="text-primary">العهدة الافتتاحية للصندوق:</strong>{' '}
                    <span className="text-on-surface font-mono">{b.openingCash} ج.م</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-2 justify-end border-t border-outline-variant/10 pt-4 text-xs font-bold font-sans">
                <button
                  type="button"
                  onClick={() => openAssetModal(b)}
                  className="bg-secondary-container hover:bg-outline-variant/30 text-on-secondary-container py-2 px-4 rounded-full scale-95 active:scale-90 transition-all cursor-pointer border-none"
                >
                  تعديل الأصول
                </button>
                <button
                  type="button"
                  onClick={() => openShiftModal(b)}
                  className="bg-primary hover:bg-primary-container text-on-primary py-2 px-4 rounded-full shadow-sm scale-95 active:scale-90 transition-all cursor-pointer border-none"
                >
                  تفاصيل الوردية
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal 1: Shift Details & Interactive Closure */}
      {selectedShiftBranch && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 max-w-2xl w-full text-right shadow-2xl animate-fade-in flex flex-col gap-5 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex flex-row-reverse justify-between items-center pb-2 border-b border-outline-variant/20">
              <h3 className="font-bold text-primary text-base">تسوية وردية - {selectedShiftBranch.name}</h3>
              <button
                type="button"
                onClick={() => setSelectedShiftBranch(null)}
                className="text-on-surface-variant hover:text-primary cursor-pointer bg-transparent border-none p-0 flex items-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Current Active Shift Data */}
            <div className="bg-surface p-4 rounded-lg border border-outline-variant/10 text-xs flex flex-col gap-2 font-semibold">
              <h4 className="font-bold text-sm text-primary mb-1">الوردية النشطة حالياً</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 block">أمين العهدة المسؤول:</span>
                  <span className="text-on-surface font-bold mt-0.5 block">{selectedShiftBranch.manager}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">مبيعات الوردية الجارية:</span>
                  <span className="text-green-700 font-bold font-mono mt-0.5 block">
                    {orders
                      .filter((o) => o.branch === selectedShiftBranch.code && o.status !== 'ملغى')
                      .reduce((sum, o) => sum + o.total, 0)
                      .toLocaleString()}{' '}
                    ج.م
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">رصيد صندوق الافتتاح:</span>
                  <span className="text-on-surface font-mono mt-0.5 block">
                    {selectedShiftBranch.openingCash} ج.م
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">الرصيد الكلي المتوقع بالخزينة:</span>
                  <span className="text-primary font-bold font-mono mt-0.5 block">
                    {(
                      selectedShiftBranch.openingCash +
                      orders
                        .filter((o) => o.branch === selectedShiftBranch.code && o.status !== 'ملغى')
                        .reduce((sum, o) => sum + o.total, 0)
                    ).toLocaleString()}{' '}
                    ج.م
                  </span>
                </div>
              </div>
            </div>

            {/* Shift Closure Form */}
            <form onSubmit={handleCloseShift} className="border-t border-outline-variant/20 pt-4 flex flex-col gap-3">
              <h4 className="font-bold text-sm text-primary">تسليم العهدة المالية وتثبيت الإغلاق</h4>
              <div className="flex flex-col gap-1">
                <label className="block text-xs font-bold text-on-surface-variant">
                  إجمالي المبلغ المقبوض بالدرج فعلياً (ج.م)
                </label>
                <input
                  type="number"
                  required
                  value={declaredCash}
                  onChange={(e) => setDeclaredCash(e.target.value)}
                  placeholder="أدخل المبلغ بعد الجرد اليدوي الفعلي للمحفظة والدرج"
                  className="w-full px-3 py-2.5 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary text-right font-body-md"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 rounded transition-all shadow-sm text-xs cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'تأكيد مطابقة الإغلاق المالي وتسجيل الحركة'}
              </button>
            </form>

            {/* Past Shift Reconciliation History */}
            <div className="border-t border-outline-variant/20 pt-4">
              <h4 className="font-bold text-sm text-primary mb-3">حركات التسوية السابقة للفرع</h4>
              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse text-right">
                  <thead>
                    <tr className="bg-surface-container text-on-surface font-bold border-b border-outline-variant/30">
                      <th className="p-2">تاريخ الوردية</th>
                      <th className="p-2">أمين الصندوق</th>
                      <th className="p-2 text-center">العهدة</th>
                      <th className="p-2 text-center">المبيعات</th>
                      <th className="p-2 text-center">المقبوض</th>
                      <th className="p-2 text-center">الفارق / المطابقة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 font-semibold text-on-surface-variant">
                    {pastShifts
                      .filter((s) => s.branch === selectedShiftBranch.code)
                      .map((shift, idx) => {
                        const isMatch = shift.discrepancy >= 0;
                        const badgeStyle = isMatch
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200';

                        return (
                          <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                            <td className="p-2">{shift.date}</td>
                            <td className="p-2 font-bold text-on-surface">{shift.cashier}</td>
                            <td className="p-2 text-center font-mono">{shift.openCash} ج.م</td>
                            <td className="p-2 text-center font-mono">{shift.sales} ج.م</td>
                            <td className="p-2 text-center font-mono">{shift.closeCash} ج.م</td>
                            <td className="p-2 text-center">
                              <span className={`inline-block px-2 py-0.5 border rounded font-bold text-[10px] ${badgeStyle}`}>
                                {shift.discrepancy === 0
                                  ? 'متطابق'
                                  : shift.discrepancy > 0
                                  ? `زيادة (+${shift.discrepancy})`
                                  : `عجز (${shift.discrepancy})`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    {pastShifts.filter((s) => s.branch === selectedShiftBranch.code).length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-gray-400">
                          لا توجد إغلاقات سابقة مسجلة في هذا الفرع.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Branch Assets */}
      {selectedAssetBranch && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleEditAssets}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 max-w-md w-full text-right shadow-2xl animate-fade-in flex flex-col gap-4 font-sans"
          >
            <div className="flex flex-row-reverse justify-between items-center pb-2 border-b border-outline-variant/20">
              <h3 className="font-bold text-primary text-base">تعديل أصول - {selectedAssetBranch.name}</h3>
              <button
                type="button"
                onClick={() => setSelectedAssetBranch(null)}
                className="text-on-surface-variant hover:text-primary cursor-pointer bg-transparent border-none p-0 flex items-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">المدير المسؤول عن الفرع</label>
              <input
                type="text"
                required
                value={editManager}
                onChange={(e) => setEditManager(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary text-right font-body-md"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">
                إجمالي الطاولات المهيأة بالصالة
              </label>
              <input
                type="number"
                required
                min="1"
                max="50"
                value={editTables}
                onChange={(e) => setEditTables(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary text-right font-body-md"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-outline-variant/20 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setSelectedAssetBranch(null)}
                className="px-4 py-2 border border-outline-variant/50 rounded text-xs font-bold hover:bg-surface-container cursor-pointer bg-transparent"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded font-bold text-xs cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ تعديلات الأصول'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Add New Branch */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateBranch}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 max-w-md w-full text-right shadow-2xl animate-fade-in flex flex-col gap-4 font-sans"
          >
            <div className="flex flex-row-reverse justify-between items-center pb-2 border-b border-outline-variant/20">
              <h3 className="font-bold text-primary text-base">تأسيس وإضافة فرع جديد</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  playTapFeedback();
                }}
                className="text-on-surface-variant hover:text-primary cursor-pointer bg-transparent border-none p-0 flex items-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">اسم الفرع</label>
              <input
                type="text"
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="اسم الفرع"
                className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary text-right font-body-md"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">الموقع / العنوان</label>
              <input
                type="text"
                required
                value={createLocation}
                onChange={(e) => setCreateLocation(e.target.value)}
                placeholder="الموقع / العنوان"
                className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary text-right font-body-md"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">المدير المسؤول</label>
              <input
                type="text"
                required
                value={createManager}
                onChange={(e) => setCreateManager(e.target.value)}
                placeholder="المدير المسؤول"
                className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary text-right font-body-md"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">عدد طاولات الصالة المهيأة</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={createTables}
                onChange={(e) => setCreateTables(e.target.value)}
                placeholder="عدد طاولات الصالة المهيأة"
                className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary text-right font-body-md"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-outline-variant/20 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  playTapFeedback();
                }}
                className="px-4 py-2 border border-outline-variant/50 rounded text-xs font-bold hover:bg-surface-container cursor-pointer bg-transparent"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded font-bold text-xs cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'جاري الإضافة...' : 'تأسيس وإضافة الفرع'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
