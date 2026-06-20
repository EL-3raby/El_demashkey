'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';

// Thermal Receipt Print Modal Component
function ReceiptModal({ order, onClose }) {
  if (!order) return null;

  const dateStr = order.date || new Date().toLocaleString('ar-EG');
  const itemsList = order.itemsList || [];
  const orderTotal = order.total || itemsList.reduce((sum, item) => sum + item.price, 0);
  const orderNum = order.id || Math.floor(100 + Math.random() * 900);
  const branchText = order.branch === 'rahabat' ? 'فرع الراهبات' : 'الفرع الرئيسي - دمنهور';

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print-area">
      <div className="bg-white text-black p-6 rounded-lg w-full max-w-sm font-mono text-sm border-2 border-black flex flex-col text-right shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-black cursor-pointer bg-transparent border-none p-0 flex items-center print:hidden"
          aria-label="Close invoice"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="text-center font-bold text-base mb-2 pb-2 border-b-2 border-dashed border-gray-400">
          <h2 className="text-primary text-xl font-display-lg">بون طلب مطبخ دمشقي</h2>
          <p className="text-xs text-gray-600 mt-1">{branchText}</p>
        </div>

        <div className="flex flex-row-reverse justify-between text-xs text-gray-600 mb-4 border-b border-dashed border-gray-300 pb-2">
          <span>تاريخ الطلب: {dateStr}</span>
          <span>رقم الطلب: #{orderNum}</span>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <div className="flex flex-row-reverse justify-between font-bold text-xs border-b border-gray-300 pb-1">
            <span className="w-1/2 text-right">الصنف</span>
            <span className="w-1/4 text-center">الكمية</span>
            <span className="w-1/4 text-left">السعر</span>
          </div>
          {itemsList.map((item, idx) => (
            <div key={idx} className="flex flex-row-reverse justify-between text-xs">
              <span className="w-1/2 text-right">{item.name}</span>
              <span className="w-1/4 text-center">1</span>
              <span className="w-1/4 text-left">{item.price} ج.م</span>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-dashed border-gray-400 pt-3 flex flex-col gap-1 text-xs mb-4">
          <div className="flex flex-row-reverse justify-between">
            <span>قيمة الطلبات:</span>
            <span>{orderTotal} ج.م</span>
          </div>
          <div className="flex flex-row-reverse justify-between">
            <span>الخدمة والتوصيل:</span>
            <span>{order.type === 'توصيل' ? '30 ج.م' : 'مجانًا'}</span>
          </div>
          <div className="flex flex-row-reverse justify-between font-bold text-sm border-t border-dashed border-gray-300 pt-2 text-primary">
            <span>الحساب الكلي:</span>
            <span>{orderTotal + (order.type === 'توصيل' ? 30 : 0)} ج.م</span>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 border-t border-dashed border-gray-300 pt-3 font-semibold">
          شكراً لزيارتكم! بالهناء والشفاء.
        </div>

        <button
          onClick={() => window.print()}
          className="mt-6 w-full bg-primary text-white py-2 rounded font-bold text-xs hover:bg-primary-container transition-colors flex items-center justify-center gap-1.5 animate-pulse cursor-pointer print:hidden"
        >
          <span className="material-symbols-outlined text-sm">print</span>
          طباعة الفاتورة
        </button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const {
    cartItems,
    cartTotal,
    clearCart,
    showToast,
    orders,
    setOrders,
    playChime,
  } = useAppContext();

  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [branch, setBranch] = useState('main');
  const [city, setCity] = useState('دمنهور');
  const [area, setArea] = useState('');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [apartment, setApartment] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderNum, setOrderNum] = useState(0);
  const [selectedPrintOrder, setSelectedPrintOrder] = useState(null);

  const deliveryFee = deliveryMethod === 'delivery' ? 30 : 0;
  const finalTotal = cartTotal + deliveryFee;

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

  const handleCheckout = (e) => {
    e.preventDefault();
    const randOrder = Math.floor(100 + Math.random() * 900);
    setOrderNum(randOrder);
    setIsSubmitted(true);

    // Synthesize live audio chime alert
    playChime();

    // Append order to unified list
    const selectedItemsStr = cartItems.map((item) => item.name).join(' + ');
    const newOrderLog = {
      id: randOrder,
      customer: name,
      items: selectedItemsStr,
      total: cartTotal,
      type: deliveryMethod === 'delivery' ? 'توصيل' : 'استلام',
      branch: branch,
      status: paymentMethod === 'vodafone' ? 'بانتظار مراجعة الدفع' : 'جاري التحضير',
      secondsLeft: 900,
      paymentMethod: paymentMethod,
      screenshot: screenshotUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400',
      date: new Date().toLocaleString('ar-EG'),
    };
    setOrders([newOrderLog, ...orders]);

    showToast('تم استلام طلبك بنجاح! رقم الطلب: #' + randOrder, 'success');
  };

  const handleSuccessClose = () => {
    clearCart();
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <main className="max-w-container-max mx-auto px-4 md:px-10 py-12 flex-grow bg-pattern flex items-center justify-center text-right">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-8 max-w-lg w-full text-center shadow-lg animate-fade-in font-sans">
          <span
            className="material-symbols-outlined text-6xl text-primary mb-4"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            soup_kitchen
          </span>
          <h2 className="font-display-lg text-2xl text-primary font-bold mb-2">تم استلام طلبك بنجاح!</h2>
          <p className="font-body-md text-on-surface-variant mb-6 font-sans">
            يقوم طهاتنا بتحضير وجبتك اللذيذة الآن. رقم الطلب الخاص بك هو:
          </p>
          <div className="bg-secondary-container text-primary font-bold text-2xl py-3 rounded-full mb-6 font-mono font-sans">
            #{orderNum}
          </div>
          <div className="text-right border-t border-outline-variant/20 pt-4 flex flex-col gap-2 mb-6 text-sm text-on-surface-variant font-semibold">
            <div>
              <strong className="text-primary font-bold">الاسم:</strong> {name}
            </div>
            <div>
              <strong className="text-primary font-bold">طريقة الاستلام:</strong>{' '}
              {deliveryMethod === 'delivery' ? 'توصيل للمنزل' : 'استلام من الفرع'}
            </div>
            {deliveryMethod === 'delivery' ? (
              <div>
                <strong className="text-primary font-bold">العنوان:</strong> {city}، {area}، ش {street}، عمارة{' '}
                {building}، ط {floor}، شقة {apartment}
              </div>
            ) : (
              <div>
                <strong className="text-primary font-bold">الفرع:</strong>{' '}
                {branch === 'main' ? 'الفرع الرئيسي - شارع المحافظة' : 'فرع الراهبات - شارع الراهبات'}
              </div>
            )}
            <div>
              <strong className="text-primary font-bold">الهاتف:</strong> {phone}
            </div>
            <div>
              <strong className="text-primary font-bold">القيمة الإجمالية:</strong> {finalTotal} ج.م
            </div>
            <div>
              <strong className="text-primary font-bold">طريقة الدفع:</strong>{' '}
              {paymentMethod === 'vodafone' ? 'فودافون كاش (بانتظار المراجعة)' : 'كاش'}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() =>
                setSelectedPrintOrder({
                  id: orderNum,
                  total: cartTotal,
                  type: deliveryMethod === 'delivery' ? 'توصيل' : 'استلام',
                  branch: branch,
                  itemsList: cartItems,
                })
              }
              className="flex-1 bg-secondary-container text-primary py-3 rounded-full font-bold text-xs hover:bg-outline-variant/30 transition-colors flex items-center justify-center gap-1 scale-95 active:scale-90 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              طباعة فاتورة العميل
            </button>
            <Link
              href="/"
              onClick={handleSuccessClose}
              className="flex-1 bg-primary text-on-primary py-3 rounded-full font-label-sm hover:bg-primary-container text-center shadow-sm flex items-center justify-center font-bold"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>

        <ReceiptModal order={selectedPrintOrder} onClose={() => setSelectedPrintOrder(null)} />
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="max-w-container-max mx-auto px-4 md:px-10 py-16 flex-grow bg-pattern flex flex-col items-center justify-center text-center">
        <span
          className="material-symbols-outlined text-7xl text-outline-variant mb-4"
          style={{ fontVariationSettings: '"FILL" 0' }}
        >
          shopping_cart_off
        </span>
        <h2 className="font-display-lg text-2xl text-primary font-bold mb-2 font-sans">سلة المشتريات فارغة</h2>
        <p className="font-body-md text-on-surface-variant mb-6 max-w-sm">
          يبدو أنك لم تقم بإضافة أي وجبة إلى سلتك حتى الآن. تفضل بزيارة المنيو واختر ما تشتهيه.
        </p>
        <Link
          href="/menu"
          className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 scale-95 active:scale-90 transition-transform font-sans"
        >
          عرض المنيو
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-container-max mx-auto px-4 md:px-10 py-12 flex-grow bg-pattern text-right">
      <h1 className="font-display-lg text-primary text-3xl mb-8 text-center font-bold">تأكيد الطلب والدفع</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleCheckout}
          className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 md:p-8 shadow-sm flex flex-col gap-6"
        >
          <div>
            <h3 className="font-bold text-primary text-lg mb-4 pb-2 border-b border-outline-variant/20">
              البيانات الأساسية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">الاسم بالكامل</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد محمد"
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-right font-body-md"
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
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-right font-body-md"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2 font-bold">طريقة الاستلام</label>
            <div className="grid grid-cols-2 gap-4 p-1 bg-surface-container rounded-lg border border-outline-variant/30 font-sans">
              <button
                type="button"
                onClick={() => setDeliveryMethod('delivery')}
                className={`py-3 rounded-md font-bold text-sm transition-colors text-center cursor-pointer ${
                  deliveryMethod === 'delivery' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface hover:bg-surface/50'
                }`}
              >
                توصيل للمنزل
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`py-3 rounded-md font-bold text-sm transition-colors text-center cursor-pointer ${
                  deliveryMethod === 'pickup' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface hover:bg-surface/50'
                }`}
              >
                استلام من الفرع
              </button>
            </div>
          </div>

          {deliveryMethod === 'delivery' ? (
            <div className="flex flex-col gap-4 animate-fade-in">
              <h3 className="font-bold text-primary text-lg pb-2 border-b border-outline-variant/20">عنوان التوصيل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">المدينة</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-right font-body-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">المنطقة / الحي</label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="مثال: وسط البلد"
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-right font-body-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-sans">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">اسم الشارع / تفاصيل</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="اسم الشارع أو المعلم المميز"
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-right font-body-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">رقم البناية</label>
                  <input
                    type="text"
                    required
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-right font-body-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">الطابق / الشقة</label>
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="text"
                      placeholder="طابق"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      className="px-2 py-2.5 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-center font-body-md"
                    />
                    <input
                      type="text"
                      placeholder="شقة"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      className="px-2 py-2.5 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface/50 text-on-surface outline-none text-center font-body-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-fade-in font-sans">
              <h3 className="font-bold text-primary text-lg pb-2 border-b border-outline-variant/20">فرع الاستلام</h3>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1 font-semibold">اختر الفرع الأقرب لك</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-on-surface outline-none font-bold text-right"
                >
                  <option value="main">الفرع الرئيسي - شارع المحافظة أمام النادي الاجتماعي</option>
                  <option value="rahabat">فرع الراهبات - دمنهور، منتصف شارع الراهبات</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2 font-semibold">طريقة الدفع المالي</label>
            <div className="grid grid-cols-2 gap-4 mb-3 font-sans">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-3 rounded-md font-bold text-sm transition-colors text-center border cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface border-outline-variant/30 text-on-surface hover:bg-surface/50'
                }`}
              >
                الدفع نقداً (كاش)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('vodafone')}
                className={`py-3 rounded-md font-bold text-sm transition-colors text-center border cursor-pointer ${
                  paymentMethod === 'vodafone'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface border-outline-variant/30 text-on-surface hover:bg-surface/50'
                }`}
              >
                فودافون كاش (Vodafone Cash)
              </button>
            </div>

            {paymentMethod === 'vodafone' && (
              <div className="flex flex-col gap-3 border border-dashed border-outline-variant/50 p-4 rounded-lg bg-surface-container-low animate-fade-in text-xs font-sans text-right">
                <span className="font-bold text-on-surface block">
                  الرجاء إرسال إجمالي المبلغ إلى محفظة فودافون كاش:{' '}
                  <span className="text-primary font-mono text-sm block md:inline select-all">01004354228</span>
                </span>
                <span className="text-gray-500 font-semibold block">قم برفع إيصال تحويل العملية هنا:</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-on-surface cursor-pointer font-sans"
                />
                {screenshotUrl && (
                  <div className="mt-2 relative w-24 h-24 border border-outline-variant/40 rounded overflow-hidden">
                    <img src={screenshotUrl} alt="Receipt Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-primary text-on-primary py-3.5 rounded-full font-bold hover:bg-primary-container transition-colors shadow-sm text-center scale-95 active:scale-90 transition-transform cursor-pointer font-sans"
          >
            تأكيد الطلب والدفع ({finalTotal} ج.م)
          </button>
        </form>

        <div className="lg:col-span-5 bg-surface-container rounded-xl p-6 border border-outline-variant/30 shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-primary text-lg pb-2 border-b border-outline-variant/30">ملخص الطلب</h3>

          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
            {cartItems.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-row-reverse justify-between items-center bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/20"
              >
                <div className="flex flex-row-reverse gap-3 items-center">
                  <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 font-sans">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-on-surface">{item.name}</div>
                    <div className="text-xs text-on-surface-variant font-semibold">{item.price} ج.م</div>
                  </div>
                </div>
                <span className="font-bold text-primary text-sm">{item.price} ج.م</span>
              </div>
            ))}
          </div>

          <div className="border-t border-outline-variant/30 pt-4 flex flex-col gap-2 text-sm font-semibold">
            <div className="flex flex-row-reverse justify-between text-on-surface-variant">
              <span>قيمة الطلبات:</span>
              <span className="font-semibold">{cartTotal} ج.م</span>
            </div>
            <div className="flex flex-row-reverse justify-between text-on-surface-variant">
              <span>تكلفة التوصيل:</span>
              <span className="font-semibold">{deliveryMethod === 'delivery' ? '30 ج.م' : 'مجانًا'}</span>
            </div>
            <div className="flex flex-row-reverse justify-between text-base font-bold text-primary border-t border-outline-variant/20 pt-2 font-sans">
              <span>الإجمالي الكلي:</span>
              <span>{finalTotal} ج.م</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
