'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { playErrorBuzz } from '@/utils/audio';

export default function AdminStaffManagement() {
  const { staff, setStaff, adminRole, showToast } = useAppContext();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    document.title = "طاقم العمل | دمشقي أدمن";
  }, []);

  useEffect(() => {
    if (isMounted && adminRole !== 'super_admin') {
      playErrorBuzz();
      showToast('غير مصرح لك بدخول صفحة سجل الموظفين.', 'error');
      router.push('/admin/orders');
    }
  }, [adminRole, isMounted, router, showToast]);

  if (!isMounted || adminRole !== 'super_admin') {
    return null;
  }

  const handleDeleteStaff = (id, name) => {
    if (confirm(`هل أنت متأكد من إلغاء وتجميد حساب الموظف ${name} نهائياً؟`)) {
      setStaff(staff.filter((s) => s.id !== id));
      showToast(`تم حذف وتجميد حساب الموظف ${name}`, 'warning');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-right animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl font-bold text-primary font-display-lg">سجل الموظفين وطاقم العمل العام</h1>
        <p className="text-sm text-on-surface-variant mt-1">عرض صلاحيات المستخدمين وسجلات النشاط اللحظية</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto text-xs">
          <table className="w-full border-collapse text-right">
            <thead>
              <tr className="bg-surface-container text-on-surface font-bold border-b border-outline-variant/30">
                <th className="p-4">رقم الموظف</th>
                <th className="p-4">اسم الموظف</th>
                <th className="p-4">اسم المستخدم</th>
                <th className="p-4">الصلاحية الحالية</th>
                <th className="p-4">الفرع</th>
                <th className="p-4">آخر نشاط مسجل</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-semibold text-on-surface-variant">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-4 font-mono text-primary font-bold">#{member.id}</td>
                  <td className="p-4 font-bold text-on-surface">{member.name}</td>
                  <td className="p-4 font-mono">{member.username}</td>
                  <td className="p-4">
                    <span className="inline-block bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[10px] font-bold font-sans">
                      {member.roleText}
                    </span>
                  </td>
                  <td className="p-4">{member.branchText || 'الكل'}</td>
                  <td className="p-4 text-xs italic">{member.log}</td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(member.id, member.name)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1 px-3 rounded text-[10px] transition-colors cursor-pointer border-none"
                    >
                      حذف وتجميد
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-on-surface-variant">
                    لا يوجد موظفين مسجلين حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
