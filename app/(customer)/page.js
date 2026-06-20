'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

export default function HomePage() {
  const { addToCart, showToast, orders, setOrders, playChime, tablesData, menuCatalog } = useAppContext();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState('2');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [branch, setBranch] = useState('main');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [screenshotUrl, setScreenshotUrl] = useState(null);

  // Selected meals for booking
  const [bookingMeals, setBookingMeals] = useState([]);

  // Sync booking meals from dynamic menu catalog
  useEffect(() => {
    if (menuCatalog) {
      setBookingMeals(
        menuCatalog
          .filter((item) => item.active !== false)
          .map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: 0,
            stockLevel: item.stockLevel || 'high',
          }))
      );
    }
  }, [menuCatalog]);

  // Calculate dynamic empty tables count for selected branch
  const currentBranchTables = (tablesData && tablesData[branch]) || [];
  const emptyTablesCount = currentBranchTables.filter((t) => t.status === 'empty').length;

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketCode, setTicketCode] = useState('');

  const handleScrollToMenu = () => {
    const element = document.getElementById('menu');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMealQty = (id, delta) => {
    setBookingMeals(
      bookingMeals.map((m) => {
        if (m.id === id) {
          const newQty = Math.max(0, m.qty + delta);
          return { ...m, qty: newQty };
        }
        return m;
      })
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && phone && date && time) {
      const code = 'DM-' + Math.floor(1000 + Math.random() * 9000);
      setTicketCode(code);
      setIsSubmitted(true);

      // Synthesize live audio chime alert
      playChime();

      // Generate a structural ERP order log
      const selectedMealsStr = bookingMeals
        .filter((m) => m.qty > 0)
        .map((m) => `${m.name} (${m.qty})`)
        .join(' + ');
      const mealsPrice = bookingMeals.reduce((sum, m) => sum + m.price * m.qty, 0);
      
      const newOrderLog = {
        id: Math.floor(100 + Math.random() * 900),
        customer: name,
        items: selectedMealsStr || 'حجز طاولة فقط',
        total: mealsPrice || 0,
        type: 'حجز صالة',
        branch: branch,
        status: paymentMethod === 'vodafone' ? 'بانتظار مراجعة الدفع' : 'جاري التحضير',
        secondsLeft: 1200,
        paymentMethod: paymentMethod,
        screenshot: screenshotUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400',
        date: new Date().toLocaleString('ar-EG'),
      };
      
      setOrders([newOrderLog, ...orders]);
      showToast('تم تأكيد حجز الطاولة بنجاح! كود الحجز: ' + code, 'success');
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
            <div className="text-center py-12 text-on-surface-variant font-bold col-span-3 bg-surface-container-lowest border border-dashed border-outline-variant/30 rounded-xl select-none">
              📦 قائمة الطعام فارغة، يرجى إضافة وجبات جديدة
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
                    <div className="absolute top-2 right-2">{renderStockBadge(item.stockLevel)}</div>
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

        {isSubmitted ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-8 max-w-lg w-full mx-auto text-center shadow-lg animate-fade-in">
            <span
              className="material-symbols-outlined text-6xl text-primary mb-4 animate-scale-in"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              check_circle
            </span>
            <h2 className="font-display-lg text-2xl text-primary font-bold mb-2">تم تأكيد الحجز بنجاح!</h2>
            <p className="font-body-md text-on-surface-variant mb-6">
              يسعدنا استقبالكم في الموعد المحدد. رمز الحجز الخاص بك هو:
            </p>
            <div className="bg-secondary-container text-primary font-bold text-xl py-3 rounded-full mb-6 font-mono tracking-widest">
              {ticketCode}
            </div>
            <div className="text-right border-t border-outline-variant/20 pt-4 flex flex-col gap-2 mb-6 text-sm">
              <div>
                <strong className="text-primary">الاسم:</strong> {name}
              </div>
              <div>
                <strong className="text-primary">الهاتف:</strong> {phone}
              </div>
              <div>
                <strong className="text-primary">عدد الأفراد:</strong> {guests} أفراد
              </div>
              <div>
                <strong className="text-primary">الفرع:</strong>{' '}
                {branch === 'rahabat' ? 'فرع الراهبات' : 'الفرع الرئيسي'}
              </div>
              <div>
                <strong className="text-primary">التاريخ والوقت:</strong> {date} في {time}
              </div>
              <div>
                <strong className="text-primary">طريقة الدفع:</strong>{' '}
                {paymentMethod === 'vodafone' ? 'فودافون كاش (بانتظار المراجعة)' : 'كاش'}
              </div>
            </div>
            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full bg-primary text-on-primary py-3 rounded-full font-label-sm hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
            >
              حجز جديد
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter items-stretch rounded-2xl overflow-hidden border border-outline-variant/20 shadow-sm bg-surface-container-lowest">
            <div className="p-8 md:p-12 flex flex-col justify-center text-right">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">الاسم بالكامل</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أحمد السوري"
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-right font-body-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 01012345678"
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-right font-body-md"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">عدد الأفراد</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="w-full px-3 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-xs font-bold font-sans text-right"
                    >
                      <option value="1">فرد واحد</option>
                      <option value="2">فردين</option>
                      <option value="3">3 أفراد</option>
                      <option value="4">4 أفراد</option>
                      <option value="5">5 أفراد</option>
                      <option value="6">6 أفراد</option>
                      <option value="8">8 أفراد</option>
                      <option value="10">10+ أفراد</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">التاريخ</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-xs font-bold text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">الوقت</label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-xs font-bold text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">الفرع المفضل</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-on-surface outline-none font-bold text-xs font-sans text-right"
                  >
                    <option value="main">الفرع الرئيسي (دمنهور - شارع المحافظة)</option>
                    <option value="rahabat">فرع الراهبات (شارع الراهبات)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">
                    اطلب وجبات مع الحجز (اختياري)
                  </label>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto border border-outline-variant/30 p-2.5 rounded-lg bg-surface/50">
                    {bookingMeals.length === 0 ? (
                      <div className="text-center py-4 text-xs text-on-surface-variant font-bold select-none">
                        📦 لا توجد وجبات متاحة للطلب المسبق حالياً
                      </div>
                    ) : (
                      bookingMeals.map((meal) => (
                        <div
                          key={meal.id}
                          className="flex flex-row-reverse justify-between items-center text-xs font-bold border-b border-outline-variant/10 pb-1.5 last:border-b-0"
                        >
                          <span className="flex items-center gap-2">
                            {meal.name} ({meal.price} ج.م)
                            {renderStockBadge(meal.stockLevel)}
                          </span>
                          <div className="flex items-center gap-1.5 font-sans">
                            <button
                              type="button"
                              onClick={() => handleMealQty(meal.id, -1)}
                              className="w-6 h-6 bg-surface-container rounded border border-outline-variant/30 flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono text-sm">{meal.qty}</span>
                            <button
                              type="button"
                              onClick={() => handleMealQty(meal.id, 1)}
                              className="w-6 h-6 bg-primary text-white rounded flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">
                    طريقة دفع قيمة الحجز والوجبات
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-2 font-sans">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`py-2 rounded border font-bold text-xs transition-all cursor-pointer ${
                        paymentMethod === 'cash'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface border-outline-variant/30 text-on-surface-variant'
                      }`}
                    >
                      الدفع كاش بالمطعم
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('vodafone')}
                      className={`py-2 rounded border font-bold text-xs transition-all cursor-pointer ${
                        paymentMethod === 'vodafone'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface border-outline-variant/30 text-on-surface-variant'
                      }`}
                    >
                      فودافون كاش (تحويل مسبق)
                    </button>
                  </div>
                  {paymentMethod === 'vodafone' && (
                    <div className="flex flex-col gap-2 border border-dashed border-outline-variant/50 p-3 rounded-lg bg-surface-container-low animate-fade-in text-xs font-sans text-right">
                      <span className="font-semibold text-on-surface-variant block">
                        الرجاء التحويل إلى الرقم:{' '}
                        <strong className="text-primary font-mono select-all">01004354228</strong>
                      </span>
                      <span className="text-gray-500 block">ارفق صورة التحويل لتسهيل وتأكيد المراجعة:</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-xs text-on-surface cursor-pointer"
                      />
                      {screenshotUrl && (
                        <div className="mt-2 relative w-20 h-20 border border-outline-variant/40 rounded overflow-hidden">
                          <img
                            src={screenshotUrl}
                            alt="Vodafone Cash Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="mt-4 w-full bg-primary text-on-primary py-3.5 rounded-full font-bold hover:bg-primary-container transition-colors shadow-md flex items-center justify-center gap-2 scale-95 active:scale-90 transition-transform cursor-pointer font-sans"
                >
                  تأكيد حجز الطاولة
                </button>
              </form>
            </div>
            <div className="relative min-h-[300px] lg:min-h-full">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNZK8aodpzPAxV5GLlfxfIRw5uR72PvBnfDBeC_8nhtgFR6Nk67GKWUnljgfdHEEayMfh8BYzjGRzFbZV47C23e1TEjeEvR-VHBI6c4W1P4skwr1_JRZtwUINpslChAXjt46WxpFvR0PsVXBqKBvX6yIfgBTI_RMXeTyEgjfj2jh5I9XXYz7aKQiK5kCnjMldNeM6RheDNacUe37R24AuEzKXpgU22CjrXlfmTkY8yryzhxIvRj3eIr82jMp2ztC9_cazDovD3Bw"
                alt="Demashki Interior"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"></div>
              <div className="absolute top-6 right-6">
                <span className="bg-black/75 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-white/20 shadow-md font-sans">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                  🔥 المتاح الآن: {emptyTablesCount} {emptyTablesCount === 1 ? 'طاولة' : 'طاولات'}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
