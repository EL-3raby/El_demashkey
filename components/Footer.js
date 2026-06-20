export default function Footer() {
  return (
    <footer className="bg-secondary-container text-on-secondary-container w-full mt-auto" id="branches">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right max-w-container-max mx-auto px-4 md:px-10 py-12">
        <div className="flex flex-col items-end gap-4 text-right">
          <div className="font-headline-md text-headline-md text-primary font-bold flex items-center gap-2">
            <img
              alt="Al-Sham Gourmet Logo Footer"
              className="h-10 w-10 object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD49pB1_qsZQmcqLHH19jhIwzSFOvatEfigPbPtZAI0rIcIl5RZBW22617oxzqlER5PuuXzEDnq4mm907LLS1lT1zGssEV5VBGq0K7CaIy19HcXwSmYYm8LuZuLU2CHoCvVlpPkkbMCTGyi3ZjhWddjLfdxY-Rz2oZBLn3TA4D7CeInXJRlhBlVc-5VJwqKjX_OT5_ufineBawDKlknVlDhjJAM1ReWZEArHya0FzpsOcBw3GLFYvPl5RSc8krTvwRroeOupRYqTA"
            />
            Demashki
          </div>
          <p className="font-body-md text-body-md opacity-80 mt-2">Oriental Modernism in Every Bite.</p>
          <p className="font-body-md text-body-md mt-4 font-bold">© 2026 Al-Sham Gourmet.</p>
        </div>
        <div className="flex flex-col items-end gap-3 text-right">
          <h3 className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider mb-2">فروعنا</h3>
          <div className="flex flex-col gap-4 text-right">
            <div className="group">
              <span className="font-bold block text-on-secondary-fixed">الفرع الرئيسي</span>
              <span className="font-body-md text-sm opacity-80 group-hover:text-primary transition-colors">
                شارع المحافظة أمام النادي الاجتماعي
              </span>
            </div>
            <div className="group">
              <span className="font-bold block text-on-secondary-fixed">فرع الراهبات</span>
              <span className="font-body-md text-sm opacity-80 group-hover:text-primary transition-colors">
                دمنهور - منتصف شارع الراهبات
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 text-right">
          <h3 className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider mb-2">ساعات العمل</h3>
          <p className="font-body-md text-sm opacity-80">
            نستقبلكم يومياً من الساعة 11:00 صباحاً وحتى الساعة 02:00 بعد منتصف الليل لتقديم أشهى المأكولات الشرقية.
          </p>
        </div>
      </div>
    </footer>
  );
}
