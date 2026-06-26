'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

const LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD49pB1_qsZQmcqLHH19jhIwzSFOvatEfigPbPtZAI0rIcIl5RZBW22617oxzqlER5PuuXzEDnq4mm907LLS1lT1zGssEV5VBGq0K7CaIy19HcXwSmYYm8LuZuLU2CHoCvVlpPkkbMCTGyi3ZjhWddjLfdxY-Rz2oZBLn3TA4D7CeInXJRlhBlVc-5VJwqKjX_OT5_ufineBawDKlknVlDhjJAM1ReWZEArHya0FzpsOcBw3GLFYvPl5RSc8krTvwRroeOupRYqTA';

/** Desktop navigation link definitions */
const NAV_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/menu', label: 'قائمة الطعام' },
  { href: '/table-reservation', label: 'حجز طاولة' },
  { href: '/admin', label: 'لوحة التحكم' },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { cartItems } = useAppContext();
  const cartCount = cartItems.reduce((total, item) => total + (item.qty || 1), 0);

  /**
   * Returns whether the given link path is the active route.
   * For `/admin` we match prefix so all admin subroutes highlight.
   */
  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    if (href === '/admin') return pathname.startsWith('/admin');
    return pathname === href;
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md shadow-sm border-b-0 border-transparent relative">
      <div className="flex flex-row-reverse justify-between items-center w-full px-4 md:px-10 max-w-[1280px] mx-auto h-20">
        {/* ── Brand Logo ── */}
        <Link
          href="/"
          className="flex items-center gap-2 text-primary font-display-lg text-2xl shrink-0"
        >
          <img
            alt="Demashki Logo"
            className="h-12 w-12 object-contain"
            src={LOGO_URL}
          />
          <span className="font-bold tracking-tight">Demashki</span>
        </Link>

        {/* ── Desktop Navigation Links ── */}
        <div className="hidden md:flex flex-row-reverse gap-8 items-center h-full">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`h-full flex items-center font-body-md transition-colors ${
                isActive(link.href)
                  ? 'text-primary border-b-2 border-primary font-bold pb-1'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-row-reverse items-center gap-4">
          {/* Cart Icon with Live Badge */}
          <Link
            href="/checkout"
            className="relative text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full active:scale-90 transition-transform"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: '"FILL" 0' }}
            >
              shopping_cart
            </span>
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>

          {/* CTA Button (Desktop Only) */}
          <Link
            href="/menu"
            className="hidden md:flex bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-sm hover:bg-primary-container transition-colors items-center justify-center active:scale-90 transition-transform shadow-sm"
          >
            اطلب الآن
          </Link>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden text-on-surface-variant p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <span className="material-symbols-outlined">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Mobile Navigation Drawer ── */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 w-full bg-surface border-b border-outline-variant/30 p-6 flex flex-col gap-4 text-right shadow-lg z-50 animate-fade-in">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`font-bold py-2 border-b border-outline-variant/10 last:border-b-0 transition-colors ${
                isActive(link.href)
                  ? 'text-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile CTA */}
          <Link
            href="/menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="mt-2 bg-primary text-on-primary px-6 py-3 rounded-full font-bold text-sm text-center hover:bg-primary-container transition-colors shadow-sm"
          >
            اطلب الآن
          </Link>
        </div>
      )}
    </nav>
  );
}
