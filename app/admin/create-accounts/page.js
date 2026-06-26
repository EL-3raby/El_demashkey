'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { playErrorBuzz } from '@/utils/audio';

export default function AdminCreateAccounts() {
  const { adminRole, adminBranch, showToast, branches, staff, setStaff } = useAppContext();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('cashier');
  const [branch, setBranch] = useState(
    adminRole === 'branch_manager' ? adminBranch : 'main'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.title = "إنشاء الحسابات | دمشقي أدمن";
  }, []);

  useEffect(() => {
    if (adminRole !== 'super_admin') {
      playErrorBuzz();
      showToast('غير مصرح لك بدخول صفحة إنشاء الحسابات.', 'error');
      router.push('/admin/orders');
    }
  }, [adminRole, router, showToast]);

  useEffect(() => {
    if (adminRole !== 'branch_manager' && branches && branches.length > 0 && (branch === 'main' || !branch) && !branches.some(b => b.code === 'main')) {
      setBranch(branches[0].code);
    }
  }, [branches, adminRole, branch]);

  if (adminRole !== 'super_admin') {
    return null;
  }

  const handleCreate = (e) => {
    e.preventDefault();
    if (name && username) {
      if (isSubmitting) return;
      setIsSubmitting(true);
      const branchText = branches?.find((b) => b.code === branch)?.name || branch;
      const newAccount = {
        id: staff.length + 101,
        name: name,
        username: username,
        role: role,
        roleText:
          role === 'cashier'
            ? 'كاشير'
            : role === 'branch_manager'
            ? 'مدير فرع'
            : 'مدير عام',
        branchText: branchText,
        log: 'حساب جديد مضاف حديثاً',
      };
      setStaff([...staff, newAccount]);
      setName('');
      setUsername('');
      setIsSubmitting(false);
      showToast('تم إنشاء الحساب بنجاح لـ ' + name, 'success');
    } else {
      showToast('يرجى تعبئة كافة الحقول المطلوبة', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-right animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl font-bold text-primary font-display-lg font-sans">
          إنشاء حسابات الفروع والمدراء
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          توليد حسابات طاقم العمل وتوزيع الصلاحيات في الفرع
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleCreate}
          className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm flex flex-col gap-4"
        >
          <h3 className="font-bold text-primary text-base pb-2 border-b border-outline-variant/20 font-sans">
            بيانات الحساب الجديد
          </h3>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">الاسم بالكامل</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: يوسف الشامي"
              className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right font-body-md"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              البريد الإلكتروني / اسم المستخدم
            </label>
            <input
              type="email"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="youssef@demashki.com"
              className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right font-body-md"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1 font-semibold">نوع الصلاحية</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold font-sans text-right"
            >
              {adminRole === 'super_admin' && (
                <option value="branch_manager">مدير فرع (Branch Manager)</option>
              )}
              <option value="cashier">كاشير (Cashier)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1 font-semibold">الفرع</label>
            <select
              disabled={adminRole === 'branch_manager'}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold disabled:opacity-60 disabled:cursor-not-allowed font-sans text-right"
            >
              {branches && branches.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 rounded transition-all shadow-sm text-sm scale-95 active:scale-100 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الحساب وتفعيل الصلاحية'}
          </button>
        </form>

        <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low font-bold text-primary text-base">
            الحسابات المضافة حديثاً
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="bg-surface-container text-on-surface font-bold border-b border-outline-variant/30">
                  <th className="p-3">الاسم</th>
                  <th className="p-3">اسم المستخدم</th>
                  <th className="p-3">الصلاحية</th>
                  <th className="p-3">الفرع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface-variant font-semibold">
                {staff.map((acc, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                    <td className="p-3 font-bold text-on-surface">{acc.name}</td>
                    <td className="p-3 font-mono">{acc.username}</td>
                    <td className="p-3">
                      <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded font-bold font-sans">
                        {acc.roleText}
                      </span>
                    </td>
                    <td className="p-3">{acc.branchText}</td>
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
