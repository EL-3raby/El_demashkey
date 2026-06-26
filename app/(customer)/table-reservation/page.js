'use client';

import { useEffect } from 'react';
import ReservationForm from '@/components/ReservationForm';

/**
 * Standalone table-reservation page.
 * All logic lives in the shared <ReservationForm /> component.
 */
export default function TableReservationPage() {
  useEffect(() => {
    document.title = "حجز طاولة | مطعم دمشقي";
  }, []);
  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-4 md:px-10 py-12 bg-pattern">
      <div className="text-center mb-12">
        <span className="text-sm font-bold text-primary uppercase tracking-wider">
          احجز طاولتك
        </span>
        <h1 className="text-3xl font-bold text-on-surface mt-2 font-display-lg">
          حجز طاولة مباشر
        </h1>
        <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
          احجز جلستك لتضمن مكاناً فورياً في أجواء دمشقي الدافئة
        </p>
      </div>

      <ReservationForm />
    </main>
  );
}
