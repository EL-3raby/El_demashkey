'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';

// Stock badge helper
const renderStockBadge = (level) => {
  if (level === 'high') {
    return (
      <span className="inline-block bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-bold font-sans">
        متوفر بكثرة
      </span>
    );
  }
  if (level === 'low') {
    return (
      <span className="inline-block bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold animate-pulse font-sans">
        مخزون منخفض
      </span>
    );
  }
  return (
    <span className="inline-block bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold font-sans">
      مستنفذ تماماً
    </span>
  );
};

export default function AdminMenuEditor() {
  const { showToast } = useAppContext();

  const [menuItems, setMenuItems] = useState([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImg, setNewImg] = useState(
    'https://images.unsplash.com/photo-1644704180697-46280a1557a3?q=80&w=600'
  );
  const [newStock, setNewStock] = useState('high');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImg(reader.result); // Base64 data URL
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleActive = (id) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, active: !item.active };
        }
        return item;
      })
    );
    showToast('تم تحديث حالة الصنف في المنيو', 'warning');
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newName && newPrice) {
      const newItem = {
        id: menuItems.length + 1,
        name: newName,
        price: parseFloat(newPrice),
        desc: newDesc,
        img: newImg,
        active: true,
        stockLevel: newStock,
      };
      setMenuItems([...menuItems, newItem]);
      setNewName('');
      setNewPrice('');
      setNewDesc('');
      setNewImg('https://images.unsplash.com/photo-1644704180697-46280a1557a3?q=80&w=600');
      setNewStock('high');
      setShowAddForm(false);
      showToast('تم إضافة الصنف ' + newName + ' بنجاح', 'success');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-right animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary font-display-lg">إدارة قائمة الطعام (المنيو)</h1>
          <p className="text-sm text-on-surface-variant mt-1">إضافة وحذف وتعديل حالة توفر الأطباق والوجبات</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary hover:bg-primary-container text-on-primary font-bold py-2 px-4 rounded-full transition-all shadow-sm text-sm flex items-center gap-1.5 scale-95 active:scale-90 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          إضافة صنف جديد
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddItem}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm flex flex-col gap-4 animate-fade-in"
        >
          <h3 className="font-bold text-primary text-sm">بيانات الصنف الجديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">اسم الوجبة</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right font-body-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">السعر (ج.م)</label>
              <input
                type="number"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right font-body-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">وصف الصنف</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right font-body-md"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1">مستوى توفر المواد</label>
              <select
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant/60 rounded text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold text-right"
              >
                <option value="high">متوفر بكثرة</option>
                <option value="low">مخزون منخفض</option>
                <option value="empty">مستنفذ تماماً</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 font-semibold">
                صورة الوجبة (ملف من الجهاز)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-on-surface-variant file:bg-primary file:text-white file:border-0 file:py-1 file:px-2 file:rounded file:text-xs file:font-bold file:cursor-pointer"
              />
            </div>
          </div>

          {newImg && (
            <div className="mt-1 flex flex-col gap-1 items-end">
              <span className="text-[10px] text-gray-500 font-bold">معاينة الصورة المختارة:</span>
              <div className="w-16 h-16 rounded overflow-hidden border border-outline-variant/30">
                <img src={newImg} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-outline-variant/50 rounded text-xs font-bold hover:bg-surface-container transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded font-bold text-xs transition-all cursor-pointer"
            >
              حفظ الصنف
            </button>
          </div>
        </form>
      )}

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm font-sans">
        <div className="overflow-x-auto text-xs">
          <table className="w-full border-collapse text-right">
            <thead>
              <tr className="bg-surface-container text-on-surface font-bold border-b border-outline-variant/30">
                <th className="p-4">رقم الصنف</th>
                <th className="p-4">صورة الصنف</th>
                <th className="p-4">اسم الصنف</th>
                <th className="p-4">السعر</th>
                <th className="p-4">مستوى توفر المواد</th>
                <th className="p-4">الوصف</th>
                <th className="p-4 text-center">الحالة</th>
                <th className="p-4 text-center">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-semibold text-on-surface-variant">
              {menuItems.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-4 font-mono text-primary font-bold">#{item.id}</td>
                  <td className="p-4">
                    <div className="w-10 h-10 rounded overflow-hidden border border-outline-variant/30">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="p-4 font-bold text-on-surface">{item.name}</td>
                  <td className="p-4 font-mono">{item.price} ج.م</td>
                  <td className="p-4">{renderStockBadge(item.stockLevel || 'high')}</td>
                  <td className="p-4">{item.desc}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.active ? 'نشط' : 'غير نشط / نفذ'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(item.id)}
                      className={`py-1 px-3 rounded text-[10px] font-bold transition-all shadow-sm cursor-pointer ${
                        item.active
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {item.active ? 'تعطيل الوجبة' : 'تفعيل الوجبة'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
