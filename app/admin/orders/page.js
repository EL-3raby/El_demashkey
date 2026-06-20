'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';

export default function AdminOrdersPage() {
  const {
    adminRole,
    adminBranch,
    orders,
    setOrders,
    showToast,
    playChime,
    branches,
  } = useAppContext();

  const currentRole = adminRole;
  const activeBranch = adminBranch;

  // ── Local modal states ──
  const [selectedVodafoneOrder, setSelectedVodafoneOrder] = useState(null);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [selectedPrintOrder, setSelectedPrintOrder] = useState(null);

  // ── Live Kitchen Countdown Timer ──
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.secondsLeft !== null && order.secondsLeft > -300) {
            return { ...order, secondsLeft: order.secondsLeft - 1 };
          }
          return order;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [setOrders]);

  // ── Time Formatter ──
  const formatTime = (seconds) => {
    if (seconds <= 0) {
      return (
        <span className="text-error font-bold animate-pulse">⚠️ متأخر!</span>
      );
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // ── Order Action Handlers ──
  const handleExtend = useCallback(
    (id) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id === id) {
            const newSeconds = Math.max(order.secondsLeft, 0) + 300;
            showToast(
              'تم تمديد وقت تجهيز الطلب #' + id + ' بمقدار 5 دقائق',
              'warning'
            );
            return { ...order, secondsLeft: newSeconds };
          }
          return order;
        })
      );
    },
    [setOrders, showToast]
  );

  const handleReady = useCallback(
    (id) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id === id) {
            showToast('الطلب #' + id + ' جاهز للتسليم الآن', 'success');
            return { ...order, status: 'جاهز للتسليم', secondsLeft: null };
          }
          return order;
        })
      );
    },
    [setOrders, showToast]
  );

  const handleCancelOrder = useCallback(
    (id) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id === id) {
            showToast('تم إلغاء الطلب #' + id, 'error');
            return { ...order, status: 'ملغى', secondsLeft: null };
          }
          return order;
        })
      );
    },
    [setOrders, showToast]
  );

  // ── Vodafone Cash Audit Handlers ──
  const handleAuditPayment = (order) => {
    setSelectedVodafoneOrder(order);
  };

  const confirmVodafonePayment = () => {
    playChime();
    setShowWhatsappModal(true);
  };

  const handleSendWhatsapp = () => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === selectedVodafoneOrder.id) {
          return { ...o, status: 'جاري التحضير' };
        }
        return o;
      })
    );
    showToast(
      'تم تأكيد الدفع وإرسال الإخطار لـ ' + selectedVodafoneOrder.customer,
      'success'
    );
    setShowWhatsappModal(false);
    setSelectedVodafoneOrder(null);
  };

  // ── Branch Filtering ──
  const filteredOrders = orders.filter(
    (o) => activeBranch === 'all' || o.branch === activeBranch
  );

  return (
    <div className="flex flex-col gap-6 text-right animate-fade-in">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-primary font-display-lg">
          إدارة الطلبات النشطة
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          مراقبة وقت تجهيز الوجبات في المطبخ وتحديث حالة التسليم
        </p>
      </div>

      {/* ── Orders Table ── */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-right text-sm">
            <thead>
              <tr className="bg-surface-container text-on-surface border-b border-outline-variant/30 font-bold">
                <th className="p-4">رقم الطلب</th>
                <th className="p-4">العميل</th>
                <th className="p-4">الفرع</th>
                <th className="p-4">الطلبات</th>
                <th className="p-4 text-center">نوع الطلب</th>
                <th className="p-4 text-center">مؤقت المطبخ</th>
                <th className="p-4 text-center">طريقة الدفع</th>
                <th className="p-4 text-center">الحالة</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="p-8 text-center text-on-surface-variant"
                  >
                    لا توجد طلبات نشطة حالياً لهذا الفرع.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    {/* Order ID */}
                    <td className="p-4 font-mono font-bold text-primary">
                      #{order.id}
                    </td>

                    {/* Customer */}
                    <td className="p-4 font-bold text-on-surface">
                      {order.customer}
                    </td>

                    {/* Branch */}
                    <td className="p-4 text-xs font-semibold text-on-surface-variant">
                      {branches?.find((b) => b.code === order.branch)?.name || order.branch}
                    </td>

                    {/* Items */}
                    <td
                      className="p-4 text-xs max-w-xs truncate"
                      title={order.items}
                    >
                      {order.items}
                    </td>

                    {/* Order Type Badge */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          order.type === 'توصيل'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-outline-variant/30 text-on-surface-variant'
                        }`}
                      >
                        {order.type}
                      </span>
                    </td>

                    {/* Kitchen Timer */}
                    <td className="p-4 text-center font-mono font-bold text-base tracking-wider">
                      {order.secondsLeft !== null
                        ? formatTime(order.secondsLeft)
                        : '—'}
                    </td>

                    {/* Payment Method */}
                    <td className="p-4 text-center text-xs font-bold text-on-surface-variant">
                      {order.paymentMethod === 'vodafone'
                        ? 'فودافون كاش'
                        : 'نقداً (كاش)'}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 text-center">
                      {order.status === 'بانتظار مراجعة الدفع' ? (
                        <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                          بانتظار مراجعة الدفع
                        </span>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            order.status === 'جاري التحضير'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : order.status === 'ملغى'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2 items-center">
                        {/* Courier tracking shortcut for delivery orders */}
                        {order.type === 'توصيل' &&
                          order.status !== 'ملغى' && (
                            <button
                              type="button"
                              onClick={() =>
                                showToast(
                                  'جاري الاتصال بمندوب التوصيل لمتابعة الطلب #' +
                                    order.id,
                                  'warning'
                                )
                              }
                              className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                              title="اتصال بمندوب التوصيل لمتابعة الطلب"
                            >
                              <span className="material-symbols-outlined text-sm font-bold">
                                call
                              </span>
                            </button>
                          )}

                        {/* Print Receipt */}
                        <button
                          type="button"
                          onClick={() => setSelectedPrintOrder(order)}
                          className="bg-surface-variant text-on-surface hover:bg-outline-variant/30 text-xs font-bold py-1.5 px-3 rounded transition-all flex items-center gap-1 active:scale-90 transition-transform"
                        >
                          <span className="material-symbols-outlined text-xs">
                            print
                          </span>
                          بون
                        </button>

                        {/* Vodafone Cash Audit Button */}
                        {order.status === 'بانتظار مراجعة الدفع' && (
                          <button
                            type="button"
                            onClick={() => handleAuditPayment(order)}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-1.5 px-3 rounded transition-all flex items-center gap-1 shadow active:scale-90"
                          >
                            <span className="material-symbols-outlined text-xs">
                              payments
                            </span>
                            مراجعة
                          </button>
                        )}

                        {/* In-preparation actions: Extend + Ready */}
                        {order.status === 'جاري التحضير' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleExtend(order.id)}
                              className="bg-secondary-container hover:bg-outline-variant/30 text-on-secondary-container text-xs font-bold py-1.5 px-3 rounded transition-all flex items-center gap-1 active:scale-90 transition-transform"
                            >
                              <span className="material-symbols-outlined text-xs">
                                more_time
                              </span>
                              تمديد
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReady(order.id)}
                              className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold py-1.5 px-3 rounded transition-all flex items-center gap-1 shadow-sm active:scale-90 transition-transform"
                            >
                              <span className="material-symbols-outlined text-xs">
                                done
                              </span>
                              جاهز
                            </button>
                          </>
                        )}

                        {/* Ready for delivery badge */}
                        {order.status === 'جاهز للتسليم' && (
                          <span className="text-xs text-green-700 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">
                              check_circle
                            </span>
                            تم التجهيز
                          </span>
                        )}

                        {/* Cancel button (for non-terminal states) */}
                        {order.status !== 'ملغى' &&
                          order.status !== 'جاهز للتسليم' && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-1.5 px-2 rounded"
                              title="إلغاء الطلب"
                            >
                              إلغاء
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          Vodafone Cash Audit Modal
         ══════════════════════════════════════════════════════════════════ */}
      {selectedVodafoneOrder && !showWhatsappModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white text-black p-6 rounded-2xl w-full max-w-md border border-outline-variant shadow-2xl flex flex-col text-right relative">
            {/* Close */}
            <button
              type="button"
              onClick={() => setSelectedVodafoneOrder(null)}
              className="absolute top-4 left-4 text-gray-500 hover:text-black"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-bold text-primary text-lg mb-4 pb-1 border-b border-gray-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">
                warning
              </span>
              مراجعة تحويل فودافون كاش
            </h3>

            <div className="text-xs text-gray-700 flex flex-col gap-2.5 mb-6">
              <div>
                <strong>رقم الطلب:</strong> #{selectedVodafoneOrder.id}
              </div>
              <div>
                <strong>اسم العميل:</strong> {selectedVodafoneOrder.customer}
              </div>
              <div>
                <strong>القيمة الإجمالية للطلب:</strong>{' '}
                {selectedVodafoneOrder.total} ج.م
              </div>
              <div>
                <strong>تاريخ وتوقيت الطلب:</strong>{' '}
                {selectedVodafoneOrder.date}
              </div>

              {/* Screenshot Preview */}
              <div className="mt-2">
                <strong className="block mb-1 text-primary">
                  لقطة شاشة التحويل المرفقة:
                </strong>
                <div className="border border-gray-300 rounded-lg overflow-hidden h-48 bg-gray-50 flex items-center justify-center relative">
                  <img
                    src={selectedVodafoneOrder.screenshot}
                    alt="Vodafone Transaction"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Simulated deposit message */}
              <div className="mt-4 bg-gray-100 p-3 rounded-lg border border-gray-200 font-mono text-[11px] text-center">
                📲 رسالة إيداع المحفظة المكتشفة:
                <span className="block text-gray-600 mt-1 font-semibold text-right">
                  &quot;تم استلام مبلغ {selectedVodafoneOrder.total} ج.م من رقم
                  01004354228 بنجاح.&quot;
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={confirmVodafonePayment}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-xs hover:bg-primary-container transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">
                  check_circle
                </span>
                تأكيد الدفع وإرسال واتساب
              </button>
              <button
                type="button"
                onClick={() => setSelectedVodafoneOrder(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-bold text-xs hover:bg-gray-300 transition-all text-center"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          WhatsApp Notification Template Modal
         ══════════════════════════════════════════════════════════════════ */}
      {showWhatsappModal && selectedVodafoneOrder && (
        <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white text-black p-6 rounded-2xl w-full max-w-sm border border-outline-variant shadow-2xl flex flex-col text-right relative">
            <h3 className="font-bold text-green-600 text-base mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">chat</span>
              قالب رسالة تأكيد واتساب (WhatsApp)
            </h3>

            {/* WhatsApp message preview */}
            <div className="bg-[#e5ddd5] p-4 rounded-xl border border-gray-300 mb-6 flex flex-col gap-2 relative">
              <div className="absolute top-2 right-2 text-[9px] text-gray-500 font-bold">
                معاينة الرسالة الصادرة للعميل
              </div>
              <div className="bg-[#d9fdd3] text-black p-3 rounded-lg shadow-sm text-xs text-right max-w-[85%] self-end mt-4 leading-relaxed">
                <strong className="block text-primary text-[10px] mb-1">
                  مطعم دمشقي الشامي 🌟
                </strong>
                مرحباً {selectedVodafoneOrder.customer}، تم تأكيد عملية الدفع
                فودافون كاش لطلبك #{selectedVodafoneOrder.id} بقيمة{' '}
                {selectedVodafoneOrder.total} ج.م.
                <br />
                وجبتكم اللذيذة قيد التحضير في المطبخ الآن وسيتم تسليمها بأسرع
                وقت! شكراً لثقتكم بنا.
              </div>
              <span className="text-[9px] text-gray-400 self-end mt-1">
                11:27 ص ✓✓
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSendWhatsapp}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                إرسال وتأكيد
              </button>
              <button
                type="button"
                onClick={() => setShowWhatsappModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg font-bold text-xs hover:bg-gray-300 transition-all text-center"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Thermal Receipt Print Modal
         ══════════════════════════════════════════════════════════════════ */}
      {selectedPrintOrder && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print-area">
          <div className="bg-white text-black p-6 rounded-lg w-full max-w-sm font-mono text-sm border-2 border-black flex flex-col text-right shadow-2xl relative receipt-print-zone">
            {/* Close */}
            <button
              type="button"
              onClick={() => setSelectedPrintOrder(null)}
              className="absolute top-4 left-4 text-gray-500 hover:text-black"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Receipt Header */}
            <div className="text-center font-bold text-base mb-2 pb-2 border-b-2 border-dashed border-gray-400">
              <h2 className="text-primary text-xl font-display-lg">
                بون طلب مطبخ دمشقي
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                {branches?.find((b) => b.code === selectedPrintOrder.branch)?.name || selectedPrintOrder.branch}
              </p>
            </div>

            {/* Order meta */}
            <div className="flex flex-row-reverse justify-between text-xs text-gray-600 mb-4 border-b border-dashed border-gray-300 pb-2">
              <span>
                تاريخ الطلب:{' '}
                {selectedPrintOrder.date ||
                  new Date().toLocaleString('ar-EG')}
              </span>
              <span>رقم الطلب: #{selectedPrintOrder.id}</span>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex flex-row-reverse justify-between font-bold text-xs border-b border-gray-300 pb-1">
                <span className="w-1/2 text-right">الصنف</span>
                <span className="w-1/4 text-center">النوع</span>
                <span className="w-1/4 text-left">الإجمالي</span>
              </div>
              <div className="flex flex-row-reverse justify-between text-xs">
                <span className="w-1/2 text-right truncate">
                  {selectedPrintOrder.items}
                </span>
                <span className="w-1/4 text-center">
                  {selectedPrintOrder.type}
                </span>
                <span className="w-1/4 text-left">
                  {selectedPrintOrder.total} ج.م
                </span>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-dashed border-gray-400 pt-3 flex flex-col gap-1 text-xs mb-4">
              <div className="flex flex-row-reverse justify-between">
                <span>قيمة الطلبات:</span>
                <span>{selectedPrintOrder.total} ج.م</span>
              </div>
              <div className="flex flex-row-reverse justify-between">
                <span>الخدمة والتوصيل:</span>
                <span>
                  {selectedPrintOrder.type === 'توصيل'
                    ? '30 ج.م'
                    : 'مجانًا'}
                </span>
              </div>
              <div className="flex flex-row-reverse justify-between font-bold text-sm border-t border-dashed border-gray-300 pt-2 text-primary">
                <span>الحساب الكلي:</span>
                <span>
                  {selectedPrintOrder.total +
                    (selectedPrintOrder.type === 'توصيل' ? 30 : 0)}{' '}
                  ج.م
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 border-t border-dashed border-gray-300 pt-3 font-semibold">
              شكراً لزيارتكم! بالهناء والشفاء.
            </div>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="mt-6 w-full bg-primary text-white py-2 rounded font-bold text-xs hover:bg-primary-container transition-colors flex items-center justify-center gap-1.5 animate-pulse"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              طباعة الفاتورة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
