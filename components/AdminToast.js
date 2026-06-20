'use client';

import { useAppContext } from '@/context/AppContext';

export default function AdminToast() {
  const { toast, hideToast } = useAppContext();

  if (!toast || !toast.visible) return null;

  let bg = 'bg-green-600 text-white';
  let icon = 'check_circle';
  if (toast.type === 'error' || toast.type === 'danger') {
    bg = 'bg-red-600 text-white';
    icon = 'error';
  } else if (toast.type === 'warning' || toast.type === 'amber') {
    bg = 'bg-amber-500 text-white';
    icon = 'warning';
  }

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3 rounded-full shadow-lg ${bg} animate-fade-in font-bold text-sm border border-white/10`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      <span>{toast.message}</span>
      <button
        onClick={hideToast}
        className="hover:opacity-75 transition-opacity mr-2 cursor-pointer bg-transparent border-none p-0 flex items-center"
        aria-label="Close notification"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}
