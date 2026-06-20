'use client';

import { useState, Fragment, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { playTapFeedback, playErrorBuzz } from '@/utils/audio';

export default function AdminTableLayout() {
  const {
    adminRole,
    adminBranch,
    tablesData,
    setTablesData,
    showToast,
    branches,
  } = useAppContext();

  // Determine branch based on user permissions
  const [selectedBranch, setSelectedBranch] = useState('');

  // Sync selected branch if context updates
  useEffect(() => {
    const defaultBranch = branches && branches.length > 0 ? branches[0].code : 'main';
    if (adminRole === 'super_admin') {
      if (!selectedBranch) {
        setSelectedBranch(defaultBranch);
      }
    } else {
      setSelectedBranch(adminBranch === 'all' ? defaultBranch : adminBranch);
    }
  }, [adminBranch, adminRole, branches, selectedBranch]);

  const [selectedTable, setSelectedTable] = useState(null);
  const [newStatus, setNewStatus] = useState('empty');
  const [newCustomer, setNewCustomer] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'empty', 'occupied', 'reserved'

  const currentTables = tablesData[selectedBranch] || [];

  // Live Summary Aggregators
  const totalTables = currentTables.length;
  const emptyCount = currentTables.filter((t) => t.status === 'empty').length;
  const occupiedCount = currentTables.filter((t) => t.status === 'occupied').length;
  const reservedCount = currentTables.filter((t) => t.status === 'reserved').length;

  // Filter logic
  const filteredTables = currentTables.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  const handleTableClick = (table) => {
    setSelectedTable(table);
    setNewStatus(table.status);
    setNewCustomer(table.customer || '');
    setNewNotes(table.notes || '');
  };

  const handleSaveStatus = (e) => {
    e.preventDefault();
    const updatedTables = currentTables.map((t) => {
      if (t.id === selectedTable.id) {
        return {
          ...t,
          status: newStatus,
          customer: newStatus === 'empty' ? '' : newCustomer,
          notes: newStatus === 'empty' ? '' : newNotes,
        };
      }
      return t;
    });

    const newTablesData = { ...tablesData };
    newTablesData[selectedBranch] = updatedTables;
    setTablesData(newTablesData);

    setSelectedTable(null);
    playTapFeedback();
    showToast(`تم تحديث حالة ${selectedTable.name} بنجاح`, 'success');
  };

  // Add Table Form Handler
  const handleCreateTable = (e) => {
    e.preventDefault();
    
    // RBAC Security Lockdown Check
    if (adminRole === 'cashier') {
      playErrorBuzz();
      showToast('🔐 عذراً، لا تمتلك صلاحية تعديل أو حذف هيكل الصالة!', 'error');
      return;
    }

    const tableName = e.target.tableNameInput.value.trim();
    const tableCapacity = parseInt(e.target.tableCapacityInput.value) || 2;

    if (tableName) {
      // Avoid duplicate table names in same branch
      if (currentTables.some((t) => t.name === tableName)) {
        playErrorBuzz();
        showToast('⚠️ اسم الطاولة موجود بالفعل في هذا الفرع!', 'error');
        return;
      }

      const nextId = currentTables.length > 0 ? Math.max(...currentTables.map((t) => t.id)) + 1 : 1;
      const newTable = {
        id: nextId,
        name: tableName,
        capacity: tableCapacity,
        status: 'empty',
        customer: '',
        notes: '',
      };

      const newTablesData = { ...tablesData };
      newTablesData[selectedBranch] = [...currentTables, newTable];
      setTablesData(newTablesData);

      e.target.reset();
      playTapFeedback();
      showToast(`تمت إضافة ${tableName} بنجاح`, 'success');
    }
  };

  // Delete Table Handler
  const handleDeleteTable = (e, tableId, tableName) => {
    e.stopPropagation(); // Avoid triggering details modal

    // RBAC Security Lockdown Check
    if (adminRole === 'cashier') {
      playErrorBuzz();
      showToast('🔐 عذراً، لا تمتلك صلاحية تعديل أو حذف هيكل الصالة!', 'error');
      return;
    }

    if (confirm(`هل أنت متأكد من حذف ${tableName} نهائياً من الصالة؟`)) {
      const updated = currentTables.filter((t) => t.id !== tableId);
      const newTablesData = { ...tablesData };
      newTablesData[selectedBranch] = updated;
      setTablesData(newTablesData);

      playTapFeedback();
      showToast(`تم حذف ${tableName} من الصالة`, 'warning');
    }
  };

  // Quick Actions (All Roles)
  const handleQuickBook = (e, table) => {
    e.stopPropagation();
    const customerName = prompt('الرجاء إدخال اسم العميل للحجز السريع:');
    if (customerName && customerName.trim()) {
      const updated = currentTables.map((t) => {
        if (t.id === table.id) {
          return {
            ...t,
            status: 'reserved',
            customer: customerName.trim(),
            notes: 'حجز سريع من لوحة الطاولات',
          };
        }
        return t;
      });

      const newTablesData = { ...tablesData };
      newTablesData[selectedBranch] = updated;
      setTablesData(newTablesData);

      playTapFeedback();
      showToast(`تم الحجز السريع لـ ${table.name} باسم: ${customerName}`, 'success');
    }
  };

  const handleQuickFree = (e, table) => {
    e.stopPropagation();
    if (confirm(`هل أنت متأكد من إخلاء ${table.name} وتفريغ بيانات العميل؟`)) {
      const updated = currentTables.map((t) => {
        if (t.id === table.id) {
          return {
            ...t,
            status: 'empty',
            customer: '',
            notes: '',
          };
        }
        return t;
      });

      const newTablesData = { ...tablesData };
      newTablesData[selectedBranch] = updated;
      setTablesData(newTablesData);

      playTapFeedback();
      showToast(`تم إخلاء ${table.name} بنجاح`, 'warning');
    }
  };

  const showAdminControls = adminRole === 'super_admin' || adminRole === 'branch_manager';

  return (
    <div className="flex flex-col gap-6 text-right animate-fade-in font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary font-display-lg">خريطة وتوزيع طاولات الصالة</h1>
          <p className="text-sm text-on-surface-variant mt-1">مراقبة وإدارة حالة الطاولات في الصالة وحجوزات النزلاء</p>
        </div>

        {/* Branch Selector (Super Admin only) */}
        {adminRole === 'super_admin' ? (
          <div className="flex flex-row-reverse items-center gap-3">
            <span className="text-sm font-bold text-on-surface-variant">اختر الفرع للمعالجة:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-4 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-sm font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary outline-none cursor-pointer"
            >
              {branches && branches.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            فرع: {branches?.find((b) => b.code === selectedBranch)?.name || selectedBranch}
          </span>
        )}
      </div>

      {/* Summary Widgets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 flex flex-row-reverse justify-between items-center shadow-sm">
          <div className="text-right">
            <span className="text-xs text-on-surface-variant block">إجمالي الطاولات</span>
            <span className="text-2xl font-bold text-on-surface font-mono">{totalTables}</span>
          </div>
          <span className="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-lg text-2xl">
            table_restaurant
          </span>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 flex flex-row-reverse justify-between items-center shadow-sm">
          <div className="text-right">
            <span className="text-xs text-on-surface-variant block">مشغولة</span>
            <span className="text-2xl font-bold text-error font-mono">{occupiedCount}</span>
          </div>
          <span className="material-symbols-outlined text-error bg-error/10 p-2.5 rounded-lg text-2xl">
            dining
          </span>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 flex flex-row-reverse justify-between items-center shadow-sm">
          <div className="text-right">
            <span className="text-xs text-on-surface-variant block">محجوزة</span>
            <span className="text-2xl font-bold text-amber-500 font-mono">{reservedCount}</span>
          </div>
          <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-2.5 rounded-lg text-2xl">
            bookmark
          </span>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 flex flex-row-reverse justify-between items-center shadow-sm">
          <div className="text-right">
            <span className="text-xs text-on-surface-variant block">فارغة</span>
            <span className="text-2xl font-bold text-green-600 font-mono">{emptyCount}</span>
          </div>
          <span className="material-symbols-outlined text-green-600 bg-green-500/10 p-2.5 rounded-lg text-2xl">
            check_circle
          </span>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left/Main Column: Tables Grid */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Inline Filter Tabs */}
          <div className="flex flex-row-reverse gap-2 bg-surface-container/60 p-1.5 rounded-lg self-start border border-outline-variant/20 text-xs font-bold font-sans">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${
                filterStatus === 'all' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              عرض الكل
            </button>
            <button
              onClick={() => setFilterStatus('empty')}
              className={`px-4 py-2 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'empty' ? 'bg-green-600 text-white' : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              <span>الطاولات الفارغة</span>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </button>
            <button
              onClick={() => setFilterStatus('occupied')}
              className={`px-4 py-2 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'occupied' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              <span>الطاولات المشغولة</span>
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
            </button>
            <button
              onClick={() => setFilterStatus('reserved')}
              className={`px-4 py-2 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'reserved' ? 'bg-amber-500 text-white' : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              <span>الطاولات المحجوزة</span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </button>
          </div>

          {/* Tables Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredTables.length === 0 ? (
              <div className="col-span-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-12 text-center text-on-surface-variant font-semibold shadow-sm">
                <span className="material-symbols-outlined text-4xl block text-outline-variant mb-2">
                  grid_off
                </span>
                لا توجد طاولات تطابق التصفية الحالية.
              </div>
            ) : (
              filteredTables.map((table) => {
                let statusBg = 'bg-green-50 text-green-700 border-green-200';
                let statusText = 'فارغة';
                let actionButton = null;

                if (table.status === 'reserved') {
                  statusBg = 'bg-amber-50 text-amber-700 border-amber-200';
                  statusText = 'محجوزة';
                  actionButton = (
                    <button
                      onClick={(e) => handleQuickFree(e, table)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 rounded-md text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer border-none"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      إخلاء الطاولة
                    </button>
                  );
                } else if (table.status === 'occupied') {
                  statusBg = 'bg-red-50 text-red-700 border-red-200';
                  statusText = 'مشغولة';
                } else {
                  // Empty
                  actionButton = (
                    <button
                      onClick={(e) => handleQuickBook(e, table)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 rounded-md text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer border-none"
                    >
                      <span className="material-symbols-outlined text-sm">bookmark_add</span>
                      حجز سريع
                    </button>
                  );
                }

                return (
                  <div
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between items-stretch cursor-pointer hover:shadow-md transition-all scale-95 hover:scale-100 duration-300 relative group min-h-[220px]"
                  >
                    {/* Delete Icon (Super Admin & Branch Manager only) */}
                    {showAdminControls && (
                      <button
                        onClick={(e) => handleDeleteTable(e, table.id, table.name)}
                        className="absolute top-3 left-3 text-on-surface-variant hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer border-none bg-transparent"
                        title="حذف الطاولة"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}

                    {/* Table Title and Capacity */}
                    <div>
                      <div className="flex flex-row-reverse justify-between items-center mb-2">
                        <span className="font-bold text-base text-on-surface">{table.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBg}`}>
                          {statusText}
                        </span>
                      </div>
                      <div className="text-xs text-on-surface-variant font-semibold flex items-center gap-1 mb-3">
                        <span className="material-symbols-outlined text-sm">groups</span>
                        <span>السعة: {table.capacity} أفراد</span>
                      </div>

                      {/* Customer Details */}
                      {table.customer && (
                        <div className="bg-surface p-2.5 rounded-lg text-xs mb-4 border border-outline-variant/10 text-right">
                          <div className="font-bold text-primary truncate">العميل: {table.customer}</div>
                          {table.notes && (
                            <div className="text-[10px] text-on-surface-variant mt-1 truncate">
                              ملاحظة: {table.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick Action Button */}
                    <div className="mt-auto pt-2">{actionButton}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Creation Form (Hidden from cashiers) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {showAdminControls ? (
            <form
              onSubmit={handleCreateTable}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col gap-4 animate-fade-in text-right"
            >
              <h3 className="font-bold text-primary text-base pb-2 border-b border-outline-variant/20 font-sans">
                إضافة طاولة جديدة
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">اسم / رقم الطاولة</label>
                <input
                  type="text"
                  name="tableNameInput"
                  required
                  placeholder="مثال: طاولة 9، طاولة VIP 1"
                  className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right font-body-md"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">السعة الاستيعابية (أفراد)</label>
                <input
                  type="number"
                  name="tableCapacityInput"
                  required
                  min="1"
                  max="20"
                  defaultValue="4"
                  className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right font-body-md"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-2 rounded transition-all shadow-sm text-sm scale-95 active:scale-90 cursor-pointer border-none"
              >
                تأكيد وإضافة الطاولة
              </button>
            </form>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm text-center text-on-surface-variant font-semibold text-xs flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-amber-500">lock</span>
              <p>حساب الكاشير لا يمتلك صلاحيات إضافة أو إزالة الطاولات من خريطة الصالة.</p>
            </div>
          )}
        </div>
      </div>

      {/* Details / Edit Modal */}
      {selectedTable && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveStatus}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 max-w-md w-full text-right shadow-xl animate-fade-in flex flex-col gap-4 font-sans"
          >
            <div className="flex flex-row-reverse justify-between items-center pb-2 border-b border-outline-variant/20">
              <h3 className="font-bold text-primary text-base">تعديل تفاصيل {selectedTable.name}</h3>
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="text-on-surface-variant hover:text-primary cursor-pointer bg-transparent border-none p-0 flex items-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 font-semibold">حالة الطاولة</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary font-bold text-right cursor-pointer"
              >
                <option value="empty">فارغة (🟢 Green)</option>
                <option value="reserved">محجوزة (🟡 Amber)</option>
                <option value="occupied">مشغولة حالياً (🔴 Primary Red)</option>
              </select>
            </div>

            {newStatus !== 'empty' && (
              <Fragment>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 font-semibold">اسم العميل / العائلة</label>
                  <input
                    type="text"
                    required
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 font-semibold">ملاحظات</label>
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary text-right"
                  />
                </div>
              </Fragment>
            )}

            {/* Capacity configuration and deletion (Super Admin & Branch Manager only) */}
            {showAdminControls && (
              <Fragment>
                <div className="border-t border-outline-variant/10 pt-4 mt-2">
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 font-semibold">تعديل السعة الاستيعابية</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={selectedTable.capacity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 2;
                      const updated = currentTables.map((t) =>
                        t.id === selectedTable.id ? { ...t, capacity: val } : t
                      );
                      const newTData = { ...tablesData };
                      newTData[selectedBranch] = updated;
                      setTablesData(newTData);
                      setSelectedTable({ ...selectedTable, capacity: val });
                    }}
                    className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary text-right"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={(e) => {
                    handleDeleteTable(e, selectedTable.id, selectedTable.name);
                    setSelectedTable(null);
                  }}
                  className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-1 mt-2 cursor-pointer border-none"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  حذف الطاولة من الصالة
                </button>
              </Fragment>
            )}

            <div className="flex justify-end gap-2 border-t border-outline-variant/20 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="px-4 py-2 border border-outline-variant/50 rounded text-xs font-bold hover:bg-surface-container cursor-pointer bg-transparent"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded font-bold text-xs cursor-pointer border-none"
              >
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
