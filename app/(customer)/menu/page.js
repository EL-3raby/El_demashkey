'use client';

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

export default function MenuPage() {
  const { addToCart, showToast } = useAppContext();

  const menuData = [
    {
      id: 1,
      name: 'شاورما دجاج عربي',
      price: 120,
      desc: 'وجبة شاورما دجاج ممتازة بطعم لا ينسى.',
      img: 'https://images.unsplash.com/photo-1644704180697-46280a1557a3?q=80&w=600',
      stockLevel: 'high',
    },
    {
      id: 2,
      name: 'ساندوتش شاورما لحم',
      price: 90,
      desc: 'شاورما لحم بخبز الصاج والثومية والخلطة الدمشقية.',
      img: 'https://images.unsplash.com/photo-1626700051175-6518c4793f4f?q=80&w=600',
      stockLevel: 'low',
    },
  ];

  return (
    <main className="max-w-container-max mx-auto px-4 md:px-10 py-12 flex-grow bg-pattern text-right">
      <h1 className="text-center font-display-lg text-primary text-3xl mb-8 font-bold">قائمة الطعام</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuData.map((item) => (
          <div
            key={item.id}
            className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden flex flex-col text-right animate-fade-in justify-between"
          >
            <div>
              <div className="h-48 arch-mask-menu m-2 overflow-hidden relative">
                <img className="w-full h-full object-cover" src={item.img} alt={item.name} />
                <div className="absolute top-2 right-2">{renderStockBadge(item.stockLevel)}</div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-primary text-lg">{item.name}</h3>
                <p className="text-xs text-on-surface-variant mt-1 mb-2 leading-relaxed">{item.desc}</p>
              </div>
            </div>
            <div className="p-4 pt-0">
              <span className="font-semibold text-tertiary-container">{item.price} ج.م</span>
              <button
                type="button"
                onClick={() => {
                  addToCart(item);
                  showToast('تم إضافة ' + item.name + ' إلى السلة', 'success');
                }}
                className="w-full mt-4 py-2 border-2 border-primary text-primary rounded-full hover:bg-primary hover:text-on-primary transition-all duration-300 font-bold text-sm cursor-pointer"
              >
                أضف للسلة
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
