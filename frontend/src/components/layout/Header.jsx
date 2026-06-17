import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, X, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import useAuthStore from '@/store/authStore';
import useCartStore from '@/store/cartStore';

const MEGA_MENU = {
  men: {
    label: "Men's",
    categories: [
      { label: 'T-Shirts', href: '/products?gender=male&type=tshirt', badge: 'New' },
      { label: 'Lowers', href: '/products?gender=male&type=lower', badge: null },
      { label: 'All Men', href: '/products?gender=male', badge: null },
    ],
    features: [
      { icon: <Sparkles size={14} />, text: 'AI Virtual Try-On enabled' },
      { icon: <Zap size={14} />, text: 'Ships in 24 hours' },
    ],
    accent: 'from-violet-600/10 to-blue-600/5',
    glow: 'before:from-violet-500/20',
  },
  women: {
    label: "Women's",
    categories: [
      { label: 'Tops', href: '/products?gender=female&type=tshirt', badge: 'Trending' },
      { label: 'Bottoms', href: '/products?gender=female&type=lower', badge: null },
      { label: 'All Women', href: '/products?gender=female', badge: null },
    ],
    features: [
      { icon: <Sparkles size={14} />, text: 'AI Virtual Try-On enabled' },
      { icon: <Zap size={14} />, text: 'Easy 30-day returns' },
    ],
    accent: 'from-rose-600/10 to-pink-600/5',
    glow: 'before:from-rose-500/20',
  },
};

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [megaVisible, setMegaVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const megaTimeout = useRef(null);
  const { user, setAuthModal } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mega menu when route changes
  useEffect(() => {
    setHoveredMenu(null);
    setMegaVisible(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const openMega = (key) => {
    clearTimeout(megaTimeout.current);
    setHoveredMenu(key);
    setMegaVisible(true);
  };

  const closeMega = () => {
    megaTimeout.current = setTimeout(() => {
      setHoveredMenu(null);
      setMegaVisible(false);
    }, 120);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const handleAccessoryClick = (e) => {
    e.preventDefault();
    setToastMessage('Accessories — Coming Soon ✨');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const isPill = isHome && !isScrolled;

  return (
    <>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-ink text-white px-6 py-3 rounded-full text-sm font-medium shadow-2xl animate-fade-up flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          {toastMessage}
        </div>
      )}

      <div className="fixed top-0 inset-x-0 z-50" onMouseLeave={closeMega}>
        
        {/* ── Main Header Bar ── */}
        <header
          className={`w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isPill
              ? 'h-24 md:h-28 pt-3 md:pt-4'
              : isScrolled
              ? 'h-16 md:h-20 bg-white/80 backdrop-blur-2xl border-b border-black/5 shadow-[0_4px_32px_rgba(0,0,0,0.06)]'
              : 'h-20 md:h-24 bg-white/95 backdrop-blur-sm border-b border-black/5'
          }`}
        >
          <div className="flex items-center justify-between h-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full">

            {/* Mobile hamburger */}
            <div className="md:hidden flex-none">
              <button
                className={`${isPill ? 'text-white' : 'text-ink'} p-1 transition-colors`}
                aria-label="Toggle menu"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={24} strokeWidth={2} /> : <Menu size={24} strokeWidth={2} />}
              </button>
            </div>

            {/* Logo */}
            <div className="flex-1 flex items-center justify-start">
              <Link to="/" className="group flex items-center transition-opacity hover:opacity-80">
                <img src="/logo.svg" alt="LYM|LYN" className="h-8 md:h-10 object-contain" />
              </Link>
            </div>

            {/* ── Desktop Center Nav — Pill or Flat ── */}
            <nav
              className={`hidden md:flex items-center gap-1 transition-all duration-500 ${
                isPill
                  ? 'bg-white/10 backdrop-blur-2xl border border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] rounded-full px-3 h-12'
                  : 'h-full gap-0'
              }`}
            >
              {/* MEN */}
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => openMega('men')}
                onMouseLeave={closeMega}
              >
                <NavLink
                  to="/products?gender=male"
                  className={({ isActive }) =>
                    `relative font-display text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 px-4 py-2 rounded-full ${
                      isPill
                        ? `text-white hover:bg-white/15 ${isActive ? 'bg-white/20' : ''}`
                        : `text-ink hover:text-accent ${isActive && !isHome ? 'text-accent' : ''}`
                    }`
                  }
                >
                  Men
                  {/* Active underline for non-pill state */}
                  {!isPill && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-accent transition-all duration-200 group-hover:w-full" />
                  )}
                </NavLink>
              </div>

              {/* WOMEN */}
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => openMega('women')}
                onMouseLeave={closeMega}
              >
                <NavLink
                  to="/products?gender=female"
                  className={({ isActive }) =>
                    `relative font-display text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 px-4 py-2 rounded-full ${
                      isPill
                        ? `text-white hover:bg-white/15 ${isActive ? 'bg-white/20' : ''}`
                        : `text-ink hover:text-accent ${isActive && !isHome ? 'text-accent' : ''}`
                    }`
                  }
                >
                  Women
                </NavLink>
              </div>

              {/* ACCESSORIES */}
              <div className="relative h-full flex items-center">
                <a
                  href="#"
                  onClick={handleAccessoryClick}
                  className={`relative font-display text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 px-4 py-2 rounded-full cursor-pointer ${
                    isPill
                      ? 'text-white/60 hover:text-white hover:bg-white/10'
                      : 'text-ink/60 hover:text-accent'
                  }`}
                >
                  Accessories
                  <span className="ml-1.5 text-[9px] bg-accent text-white px-1.5 py-0.5 rounded-full font-sans tracking-normal font-bold">
                    Soon
                  </span>
                </a>
              </div>
            </nav>

            {/* Right Icons */}
            <div className="flex-1 flex items-center justify-end gap-2 md:gap-3">
              
              {/* Search */}
              <div className="relative flex items-center">
                {searchOpen ? (
                  <form
                    onSubmit={handleSearchSubmit}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center rounded-full px-4 py-2 min-w-[240px] animate-fade-in border ${
                      isPill
                        ? 'bg-white/10 backdrop-blur-xl border-white/20 text-white'
                        : 'bg-white border-black/10 shadow-xl text-ink'
                    }`}
                  >
                    <Search size={15} className="mr-3 opacity-50 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm w-full placeholder:opacity-50 font-medium"
                    />
                    <button type="button" onClick={() => setSearchOpen(false)} className="opacity-50 hover:opacity-100 ml-2 transition-opacity">
                      <X size={13} />
                    </button>
                  </form>
                ) : (
                  <button
                    aria-label="Search"
                    onClick={() => setSearchOpen(true)}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      isPill ? 'text-white hover:bg-white/15' : 'text-ink hover:bg-black/5'
                    }`}
                  >
                    <Search size={19} strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* User */}
              <button
                aria-label={user ? 'My account' : 'Log in'}
                onClick={() => user ? navigate('/account') : setAuthModal(true)}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isPill ? 'text-white hover:bg-white/15' : 'text-ink hover:bg-black/5'
                }`}
              >
                <User size={19} strokeWidth={2} />
              </button>

              {/* Cart */}
              <button
                onClick={() => useCartStore.getState().setCartOpen(true)}
                aria-label={`Cart (${itemCount} items)`}
                className={`relative p-2 rounded-full transition-all duration-200 ${
                  isPill ? 'text-white hover:bg-white/15' : 'text-ink hover:bg-black/5'
                }`}
              >
                <ShoppingBag size={19} strokeWidth={2} />
                {itemCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-accent text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-scale-in ring-2 ring-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ── Compact Dropdown — floats under the nav item ── */}
        {hoveredMenu && MEGA_MENU[hoveredMenu] && (() => {
          const menu = MEGA_MENU[hoveredMenu];

          return (
            <div
              className={`absolute top-full transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${
                megaVisible && hoveredMenu
                  ? 'opacity-100 scale-y-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 scale-y-95 -translate-y-1 pointer-events-none'
              }`}
              style={{
                left: '50%',
                transform: megaVisible && hoveredMenu
                  ? 'translateX(-50%) scaleY(1)'
                  : 'translateX(-50%) scaleY(0.95)',
              }}
              onMouseEnter={() => {
                clearTimeout(megaTimeout.current);
                setMegaVisible(true);
              }}
              onMouseLeave={closeMega}
            >
              {/* The dropdown card */}
              <div
                className={`mt-2 rounded-2xl overflow-hidden shadow-2xl border ${
                  isPill
                    ? 'bg-black/40 backdrop-blur-3xl border-white/15 text-white shadow-black/50'
                    : 'bg-white/95 backdrop-blur-2xl border-black/8 text-ink shadow-black/12'
                }`}
                style={{ minWidth: '200px' }}
              >
                {/* Section header */}
                <div className={`px-4 pt-4 pb-3 border-b ${isPill ? 'border-white/8' : 'border-black/5'}`}>
                  <p className={`text-[9px] font-bold tracking-[0.22em] uppercase mb-0.5 ${isPill ? 'text-white/35' : 'text-black/30'}`}>
                    Shop
                  </p>
                  <h3 className={`font-display text-lg font-bold leading-none ${isPill ? 'text-white' : 'text-ink'}`}>
                    {menu.label}
                  </h3>
                </div>

                {/* Category links — auto-grow vertically as items added */}
                <div className="px-2 py-2">
                  {menu.categories.map((cat) => (
                    <Link
                      key={cat.href}
                      to={cat.href}
                      className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isPill
                          ? 'text-white/70 hover:text-white hover:bg-white/10'
                          : 'text-ink/70 hover:text-ink hover:bg-black/4'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <ArrowRight
                          size={12}
                          className={`opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accent shrink-0`}
                        />
                        {cat.label}
                      </span>
                      {cat.badge && (
                        <span className="text-[8px] font-bold bg-accent text-white px-1.5 py-0.5 rounded-full tracking-wide shrink-0">
                          {cat.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                {/* Feature pills */}
                <div className={`px-3 py-2.5 border-t flex flex-col gap-1.5 ${isPill ? 'border-white/8' : 'border-black/5'}`}>
                  {menu.features.map((feat, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-[11px] font-medium ${
                        isPill ? 'text-white/40' : 'text-black/40'
                      }`}
                    >
                      <span className="text-accent shrink-0">{feat.icon}</span>
                      {feat.text}
                    </div>
                  ))}
                </div>

                {/* Shop all link */}
                <div className={`px-4 py-3 border-t ${isPill ? 'border-white/8' : 'border-black/5'}`}>
                  <Link
                    to={hoveredMenu === 'men' ? '/products?gender=male' : '/products?gender=female'}
                    className="group flex items-center justify-between text-[11px] font-bold tracking-[0.14em] uppercase text-accent hover:gap-2 transition-all duration-150"
                  >
                    Shop All {menu.label}
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}

      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav
          className="md:hidden fixed inset-x-0 top-[64px] z-40 bg-white/95 backdrop-blur-2xl border-b border-black/10 shadow-2xl animate-fade-in"
          style={{ top: '64px' }}
        >
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 px-5 py-4 border-b border-black/5">
            <Search size={16} className="text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-ink placeholder:text-muted font-medium"
            />
          </form>

          {/* Nav Links */}
          <div className="px-5 py-4 space-y-1">
            {[
              { to: '/products?gender=male', label: 'Men', sub: 'T-Shirts & Lowers' },
              { to: '/products?gender=female', label: 'Women', sub: 'Tops & Bottoms' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between py-4 border-b border-black/5 group"
              >
                <div>
                  <p className="font-display text-base font-bold tracking-wide text-ink">{link.label}</p>
                  <p className="text-xs text-muted mt-0.5">{link.sub}</p>
                </div>
                <ArrowRight size={16} className="text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
            <button
              onClick={handleAccessoryClick}
              className="w-full flex items-center justify-between py-4 group"
            >
              <div>
                <p className="font-display text-base font-bold tracking-wide text-ink/50">Accessories</p>
                <p className="text-xs text-accent mt-0.5">Coming Soon</p>
              </div>
            </button>
          </div>

          {/* Bottom CTAs */}
          <div className="px-5 pb-6 pt-2 flex gap-3">
            <Link
              to="/products?gender=male"
              onClick={() => setMenuOpen(false)}
              className="flex-1 btn-primary text-sm py-3 text-center justify-center"
            >
              Shop Men
            </Link>
            <Link
              to="/products?gender=female"
              onClick={() => setMenuOpen(false)}
              className="flex-1 btn-secondary text-sm py-3 text-center justify-center"
            >
              Shop Women
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
