'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import ReservationForm from '@/components/ReservationForm';

export default function HomePage() {
  const { addToCart, showToast, menuCatalog } = useAppContext();

  useEffect(() => {
    document.title = "مطعم دمشقي | المذاق الشامي الأصيل";
  }, []);

  const handleScrollToMenu = () => {
    const element = document.getElementById('menu');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const previewItems = (menuCatalog || [])
    .filter((item) => item.active !== false)
    .slice(0, 3);

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <section className="relative w-full min-h-[819px] flex items-center justify-center overflow-hidden bg-surface-container">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center opacity-45 mix-blend-multiply"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1200")',
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-l from-surface via-surface/85 to-transparent"></div>
        </div>
        <div className="relative z-10 w-full max-w-container-max mx-auto px-4 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-gutter items-center">
          <div className="flex flex-col gap-6 max-w-2xl text-right">
            <h1 className="font-display-lg text-4xl md:text-6xl text-primary font-bold drop-shadow-sm leading-tight animate-fade-in">
              المذاق الشامي الأصيل في قلب مصر
            </h1>
            <p className="font-body-lg text-lg md:text-xl text-on-surface-variant leading-relaxed">
              أفضل أنواع الشاورما والمشويات المحضرة بأجود المكونات الطازجة والخلطات الدمشقية السرية.
            </p>
            <div className="pt-4 flex flex-row-reverse gap-4 justify-start">
              <Link
                href="/menu"
                className="bg-primary text-on-primary px-8 py-4 rounded-full hover:bg-primary-container transition-all font-bold text-sm shadow-md scale-95 active:scale-90"
              >
                اطلب الآن
              </Link>
              <button
                onClick={handleScrollToMenu}
                className="border-2 border-primary text-primary px-8 py-4 rounded-full hover:bg-primary hover:text-on-primary transition-all font-bold text-sm shadow-sm scale-95 active:scale-90 cursor-pointer"
              >
                تصفح المنيو
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="w-full flex items-center justify-center gap-4 py-8 bg-surface">
        <div className="h-px bg-outline-variant/30 flex-1 max-w-[150px]"></div>
        <div className="text-tertiary-fixed-dim flex items-center gap-1.5 font-bold shrink-0">
          <span className="material-symbols-outlined text-lg">star</span>
          <span className="text-sm font-semibold tracking-wider">DEMASHKI</span>
          <span className="material-symbols-outlined text-lg">star</span>
        </div>
        <div className="h-px bg-outline-variant/30 flex-1 max-w-[150px]"></div>
      </div>

      {/* Menu Preview Section */}
      <section id="menu" className="w-full max-w-container-max mx-auto px-4 md:px-10 py-16 text-right bg-pattern">
        <div className="text-center mb-12">
          <span className="text-sm font-bold text-primary uppercase tracking-wider">مختاراتنا الفاخرة</span>
          <h2 className="text-3xl font-bold text-on-surface mt-2 font-display-lg">أشهر أطباق دمشقي</h2>
          <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
            تذوق أشهى الأصناف الدمشقية الأكثر طلباً من قبل زوارنا
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {previewItems.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant font-bold col-span-3 bg-surface-container-lowest border border-dashed border-outline-variant/30 rounded-xl select-none flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-4xl">inventory_2</span>
              <span>قائمة الطعام فارغة، يرجى إضافة وجبات جديدة</span>
            </div>
          ) : (
            previewItems.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden flex flex-col text-right animate-fade-in justify-between"
              >
                <div>
                  <div className="h-56 m-2 overflow-hidden rounded-lg arch-mask relative">
                    <img className="w-full h-full object-cover" src={item.img} alt={item.name} />
                    {/* Advanced Menu Stock Warning Badges */}
                    <div className="absolute top-2 right-2">
                      {item.stockLevel === 'high' && (
                        <span className="inline-block bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-bold font-sans">متوفر بكثرة</span>
                      )}
                      {item.stockLevel === 'low' && (
                        <span className="inline-block bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold animate-pulse font-sans">مخزون منخفض</span>
                      )}
                      {item.stockLevel === 'out' && (
                        <span className="inline-block bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold font-sans">مستنفذ تماماً</span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-primary text-lg">{item.name}</h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <div className="flex flex-row-reverse justify-between items-center mt-2">
                    <span className="font-semibold text-tertiary-container">{item.price} ج.م</span>
                    <button
                      onClick={() => {
                        addToCart(item);
                        showToast('تم إضافة ' + item.name + ' إلى السلة', 'success');
                      }}
                      className="py-2 px-6 border-2 border-primary text-primary rounded-full hover:bg-primary hover:text-on-primary transition-all font-bold text-xs scale-95 active:scale-90 cursor-pointer"
                    >
                      أضف للسلة
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Table Reservation Form Section */}
      <section id="reservations" className="w-full max-w-container-max mx-auto px-4 md:px-10 py-16 bg-surface text-right">
        <div className="text-center mb-12">
          <span className="text-sm font-bold text-primary uppercase tracking-wider">احجز طاولتك</span>
          <h2 className="text-3xl font-bold text-on-surface mt-2 font-display-lg">حجز طاولة مباشر</h2>
          <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
            احجز جلستك لتضمن مكاناً فورياً في أجواء دمشقي الدافئة
          </p>
        </div>
        <ReservationForm />
      </section>
    </main>
  );
}
