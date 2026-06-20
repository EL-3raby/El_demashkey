'use client';

import { useState } from 'react';

export default function AdminStaffManagement() {
  const [staffList, setStaffList] = useState([]);

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
                <th className="p-4">الصلاحية الحالية</th>
                <th className="p-4">آخر نشاط مسجل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-semibold text-on-surface-variant">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-4 font-mono text-primary font-bold">#{staff.id}</td>
                  <td className="p-4 font-bold text-on-surface">{staff.name}</td>
                  <td className="p-4">
                    <span className="inline-block bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[10px] font-bold font-sans">
                      {staff.roleText}
                    </span>
                  </td>
                  <td className="p-4 text-xs italic">{staff.log}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
