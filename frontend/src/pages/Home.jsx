import { Link } from 'react-router-dom';
import { ArrowRight, Zap, RotateCcw, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import ProductCard from '@/components/product/ProductCard';
import { productsApi } from '@/lib/api';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef(null);

  const SLIDES = [
    {
      img: '/texture_cotton.png?v=2',
      title: 'Heavy Cotton',
      desc: 'Pre-shrunk, ultra-soft combed cotton that holds its shape wash after wash. Sourced from the finest mills.',
      why: 'Cotton is naturally breathable and hypoallergenic, providing unmatched all-day comfort while maintaining a strong, structured silhouette that never looks sloppy.',
      usedIn: "Signature Men's T-Shirts, Women's Classic Tops"
    },
    {
      img: '/texture_denim.png?v=2',
      title: 'Raw Denim',
      desc: 'Premium selvedge denim woven on vintage shuttle looms for a timeless fade and unparalleled durability.',
      why: 'By keeping the denim raw, it conforms perfectly to your unique body shape over time, creating a bespoke fit and a fade pattern that tells your personal story.',
      usedIn: 'Vintage Flared Jeans, Classic Lowers'
    },
    {
      img: '/texture_knit.png?v=2',
      title: 'Ribbed Knit',
      desc: 'Breathable, stretchable, and deeply textured for the perfect drape and all-day comfort.',
      why: 'The ribbed structure provides immense horizontal stretch without losing its vertical integrity, meaning it hugs your curves perfectly without bagging out.',
      usedIn: "Women's Skirts, Premium Lounge Bottoms"
    }
  ];

  // Load featured products
  useEffect(() => {
    productsApi.list({ limit: 10 })
      .then((res) => {
        const prods = (res.products || []).map(p => ({
          ...p,
          compare_at_price: p.compare_at_price || Math.floor(p.base_price * 1.3)
        }));
        setFeatured(prods);
      })
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  // IntersectionObserver for section reveal animations
  useEffect(() => {
    const sections = document.querySelectorAll('[data-reveal]');
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', 'true');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Fabric slider autoplay — useCallback ensures stable refs, no stale closures
  const stopAutoPlay = useCallback(() => {
    clearInterval(intervalRef.current);
  }, []);

  const startAutoPlay = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 10000);
  }, [SLIDES.length]);

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);

  const slideLeft = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    startAutoPlay(); // reset timer on manual navigation
  };
  const slideRight = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    startAutoPlay();
  };

  return (
    <div>
      <style>{`
        @keyframes marquee-left {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee-left { animation: marquee-left 55s linear infinite; width: max-content; }
        .animate-marquee-right { animation: marquee-right 55s linear infinite; width: max-content; }
        .animate-marquee-left:hover, .animate-marquee-right:hover { animation-play-state: paused; }

        /* IntersectionObserver reveal — triggered by data-visible="true" */
        [data-reveal] {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        [data-reveal][data-visible="true"] {
          opacity: 1;
          transform: translateY(0);
        }
        [data-reveal-delay="1"] { transition-delay: 0.1s; }
        [data-reveal-delay="2"] { transition-delay: 0.2s; }
        [data-reveal-delay="3"] { transition-delay: 0.3s; }

        /* Respect prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          [data-reveal], .animate-marquee-left, .animate-marquee-right {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url('/texture_cotton.png?v=2')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            mixBlendMode: 'overlay'
          }}
        />
        <div className="relative z-10 text-center px-4">
          <p className="font-sans text-sm md:text-base font-bold tracking-widest uppercase mb-6 animate-fade-up text-white/70">
            Engineered Basics
          </p>
          <h1 className="font-display text-5xl md:text-8xl lg:text-[9rem] font-bold tracking-tight mb-8 animate-fade-up animate-delay-100 drop-shadow-lg">
            LYM|LYN
          </h1>
          <p className="font-sans text-lg md:text-2xl text-white/80 max-w-2xl mx-auto mb-12 animate-fade-up animate-delay-200">
            Premium essentials redefined with absolute precision and the perfect fit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animate-delay-300">
            <Link to="/products?gender=male" className="btn-accent w-full sm:w-auto text-lg px-8 py-4 shadow-xl">
              Shop Men
            </Link>
            <Link to="/products?gender=female" className="btn-secondary w-full sm:w-auto text-lg px-8 py-4 bg-white/10 text-white border-white/30 hover:bg-white hover:text-ink">
              Shop Women
            </Link>
          </div>
        </div>
      </section>

      {/* ── Try-On Callout ── */}
      <section className="bg-accent text-white py-5">
        <div className="container-site flex items-center justify-center gap-3">
          <Zap size={16} className="shrink-0" />
          <p className="text-sm font-medium tracking-wide text-center">
            New: Virtual Try-On — see how any piece looks on your body type, skin tone, and fit before you buy.
          </p>
          <Link to="/products" className="text-sm font-bold underline underline-offset-2 shrink-0 hover:no-underline">
            Try It
          </Link>
        </div>
      </section>

      {/* ── Featured Products Marquee ── */}
      <section className="section overflow-hidden min-h-[100vh] flex flex-col justify-center">
        <div className="container-site">
          <div className="flex items-end justify-between mb-10">
            <div data-reveal>
              <p className="text-xs font-medium tracking-widest uppercase text-muted mb-2">Discounted Collection</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-ink">Sale Event</h2>
            </div>
            <Link
              to="/products"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-muted hover:text-ink transition-colors"
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="relative flex overflow-x-hidden py-4 w-full">
          {loading ? (
            <div className="container-site w-full h-96 flex items-center justify-center">
              <span className="text-muted">Loading collection...</span>
            </div>
          ) : (
            <>
              <div className="animate-marquee-left flex gap-6 px-3" aria-hidden="true">
                {[...featured, ...featured, ...featured].map((product, i) => (
                  <div key={`marq-${product.id}-${i}`} className="w-[280px] md:w-[350px] shrink-0">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="container-site mt-10 text-center md:hidden">
          <Link to="/products" className="btn-secondary">
            View all products
          </Link>
        </div>
      </section>

      {/* ── Brand Values ── */}
      <section className="bg-ink text-white relative section min-h-[100vh] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url('/texture_denim.png?v=2')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            mixBlendMode: 'overlay'
          }}
        />
        <div className="container-site relative z-10">
          <div className="text-center mb-16" data-reveal>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">The LYM|LYN Promise</h2>
            <p className="text-white/60 max-w-lg mx-auto">We don't cut corners. From fabric sourcing to your doorstep, every step is designed for perfection.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {[
              {
                icon: <Zap size={40} strokeWidth={1} />,
                title: 'Virtual Try-On',
                desc: 'See how any piece fits your body type, skin tone, and size — before checkout.',
              },
              {
                icon: <RotateCcw size={40} strokeWidth={1} />,
                title: 'Easy Returns',
                desc: "30-day hassle-free returns. If it doesn't fit, send it back — no questions.",
              },
              {
                icon: <Truck size={40} strokeWidth={1} />,
                title: 'Fast Delivery',
                desc: 'Pan-India delivery. Most orders ship within 24 hours.',
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm animate-fade-up hover:-translate-y-2 transition-transform duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="text-accent bg-white/10 p-5 rounded-full">{item.icon}</div>
                <h3 className="font-display text-2xl font-semibold">{item.title}</h3>
                <p className="text-sm text-white/70 leading-relaxed max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fabric Detail Slider ── */}
      <section
        className="bg-ink text-white py-24 relative min-h-[100vh] flex flex-col justify-center"
        onMouseEnter={stopAutoPlay}
        onMouseLeave={startAutoPlay}
        onTouchStart={stopAutoPlay}
        onTouchEnd={startAutoPlay}
      >
        <div className="container-site mb-12 text-center" data-reveal>
          <p className="text-xs font-medium tracking-widest uppercase text-white/50 mb-2">Quality</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold">How It's Made</h2>
        </div>

        {/* Slider viewport — clips overflow */}
        <div className="relative w-full overflow-hidden">

          {/* Arrow buttons — always visible, inside the viewport */}
          <button
            onClick={slideLeft}
            aria-label="Previous slide"
            className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/35 transition-all duration-200 border border-white/20"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={slideRight}
            aria-label="Next slide"
            className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/35 transition-all duration-200 border border-white/20"
          >
            <ChevronRight size={22} />
          </button>

          {/* Slides track — CSS transform, no scrollBy */}
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {SLIDES.map((item, i) => (
              <div
                key={i}
                className="w-full shrink-0 flex flex-col md:flex-row bg-white/10 backdrop-blur-lg border-y border-white/10 text-white overflow-hidden shadow-2xl"
                style={{ minHeight: '60vh' }}
              >
                {/* Image half */}
                <div className="w-full md:w-1/2 relative" style={{ minHeight: '40vw', maxHeight: '80vh' }}>
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    style={{ position: 'absolute', inset: 0 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-ink/30 hidden md:block" />
                </div>

                {/* Content half */}
                <div className="w-full md:w-1/2 px-8 py-10 md:px-16 md:py-0 flex flex-col justify-center">
                  {/* Slide counter */}
                  <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/30 mb-4">
                    {String(i + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
                  </p>
                  <h3 className="font-display text-3xl md:text-5xl font-bold mb-4 leading-tight">{item.title}</h3>
                  <p className="text-base md:text-lg text-white/75 leading-relaxed mb-8">{item.desc}</p>
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-[10px] md:text-xs uppercase tracking-widest text-white/40 font-bold mb-1.5">Why We Use It</h4>
                      <p className="text-sm md:text-base text-white/65 leading-relaxed">{item.why}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] md:text-xs uppercase tracking-widest text-white/40 font-bold mb-1.5">Featured In</h4>
                      <p className="text-sm md:text-base text-white/90 font-medium">{item.usedIn}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators + progress */}
        <div className="container-site mt-10 flex items-center justify-center gap-3">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentSlide(i); startAutoPlay(); }}
              aria-label={`Go to slide ${i + 1}`}
              className="group relative h-0.5 rounded-full overflow-hidden transition-all duration-300"
              style={{ width: currentSlide === i ? '40px' : '16px', backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              {currentSlide === i && (
                <span
                  className="absolute inset-y-0 left-0 bg-white rounded-full"
                  style={{
                    animation: 'slide-progress 10s linear forwards',
                    width: '100%',
                  }}
                />
              )}
            </button>
          ))}
        </div>

        <style>{`
          @keyframes slide-progress {
            from { width: 0%; }
            to   { width: 100%; }
          }
        `}</style>
      </section>

      {/* ── About Us ── */}
      <section className="section bg-surface overflow-hidden min-h-[100vh] flex flex-col justify-center">
        <div className="container-site grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative aspect-[4/5] overflow-hidden rounded-2xl bg-border">
            <img src="/texture_cotton.png?v=2" alt="Studio" className="w-full h-full object-cover scale-110 opacity-70" style={{ filter: 'grayscale(100%)' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="font-display font-black leading-none tracking-tighter text-white/30 text-[8rem]">
                LYM
              </h1>
            </div>
          </div>
          <div className="order-1 md:order-2" data-reveal>
            <p className="text-xs font-medium tracking-widest uppercase text-muted mb-2">Our Mission</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-ink mb-6">Redefining Basics</h2>
            <p className="text-base text-muted leading-relaxed mb-6">
              LYM|LYN was born from a simple idea: everyday essentials shouldn't compromise on quality or fit. We believe that what you wear closest to your skin matters most.
            </p>
            <p className="text-base text-muted leading-relaxed mb-8">
              By cutting out middlemen and focusing purely on premium fabrics and timeless silhouettes, we deliver wardrobe staples that you'll reach for every single day. And with our cutting-edge AI Virtual Try-On, you can shop with absolute confidence.
            </p>
            <Link to="/about" className="btn-secondary">Read Our Story</Link>
          </div>
        </div>
      </section>

      {/* ── Reviews Marquee ── */}
      <section className="section bg-bg overflow-hidden border-t border-border py-24 min-h-[100vh] flex flex-col justify-center">
        <div className="text-center mb-12" data-reveal>
          <p className="text-xs font-medium tracking-widest uppercase text-muted mb-2">Testimonials</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-ink">Don't just take our word for it</h2>
        </div>

        <div className="flex flex-col gap-6 marquee-group py-4 overflow-hidden w-full">
          {/* Row 1: Left */}
          <div className="animate-marquee-left flex gap-6 px-3">
            {[
              { quote: "The Virtual Try-On is actual magic. I saw exactly how the shirt would drape.", name: "Rahul S." },
              { quote: "Best quality heavy cotton tees I've found in India. Doesn't lose shape.", name: "Arjun M." },
              { quote: "Finally, lowers that are styled right and actually comfortable. Fast delivery.", name: "Priya K." },
              { quote: "The fabric feels extremely premium. Far better than fast fashion brands.", name: "Neha D." },
              { quote: "Customer service is top notch. Returns were completely hassle-free.", name: "Vikram T." },
              { quote: "I love the minimal branding. The fit is absolute perfection.", name: "Sara P." },
            ].map((review) => [review, review]).flat().map((review, i) => (
              <div key={i} className="w-[350px] md:w-[450px] shrink-0 p-8 bg-surface border border-border shadow-sm rounded-2xl flex flex-col whitespace-normal hover:border-ink hover:shadow-md transition-all duration-300">
                <div className="flex text-accent mb-4">
                  {[...Array(5)].map((_, j) => <span key={j}>★</span>)}
                </div>
                <p className="text-base text-ink font-medium leading-relaxed mb-6">"{review.quote}"</p>
                <p className="text-xs text-muted font-bold tracking-wider uppercase mt-auto">— {review.name}</p>
              </div>
            ))}
          </div>

          {/* Row 2: Right */}
          <div className="animate-marquee-right flex gap-6 px-3">
            {[
              { quote: "Obsessed with the flared jeans. They fit incredibly well.", name: "Pooja V." },
              { quote: "The fabric density is just perfect. It drapes so nicely.", name: "Kabir H." },
              { quote: "I replaced my entire basic wardrobe with LYM|LYN.", name: "Aditi S." },
              { quote: "Virtual Try-On saved me from ordering the wrong size.", name: "Rohan J." },
              { quote: "The ribbed knit texture is beautiful. Very high-end.", name: "Kriti B." },
              { quote: "Incredible value for the luxury quality you receive.", name: "Amit G." },
            ].map((review) => [review, review]).flat().map((review, i) => (
              <div key={`r2-${i}`} className="w-[350px] md:w-[450px] shrink-0 p-8 bg-surface border border-border shadow-sm rounded-2xl flex flex-col whitespace-normal hover:border-ink hover:shadow-md transition-all duration-300">
                <div className="flex text-accent mb-4">
                  {[...Array(5)].map((_, j) => <span key={j}>★</span>)}
                </div>
                <p className="text-base text-ink font-medium leading-relaxed mb-6">"{review.quote}"</p>
                <p className="text-xs text-muted font-bold tracking-wider uppercase mt-auto">— {review.name}</p>
              </div>
            ))}
          </div>

          {/* Row 3: Left (offset) */}
          <div className="animate-marquee-left flex gap-6 px-3" style={{ animationDelay: '-20s' }}>
            {[
              { quote: "The packaging alone shows how much they care.", name: "Siddharth C." },
              { quote: "My go-to brand for daily wear. Exceptional durability.", name: "Maya T." },
              { quote: "The crop top length is exactly what I've been looking for.", name: "Ishaan M." },
              { quote: "Never had an easier return process. Great support.", name: "Zara R." },
              { quote: "Selvedge denim at this price point? Unbelievable.", name: "Vikas L." },
              { quote: "Everything feels so soft against the skin.", name: "Sneha P." },
            ].map((review) => [review, review]).flat().map((review, i) => (
              <div key={`r3-${i}`} className="w-[350px] md:w-[450px] shrink-0 p-8 bg-surface border border-border shadow-sm rounded-2xl flex flex-col whitespace-normal hover:border-ink hover:shadow-md transition-all duration-300">
                <div className="flex text-accent mb-4">
                  {[...Array(5)].map((_, j) => <span key={j}>★</span>)}
                </div>
                <p className="text-base text-ink font-medium leading-relaxed mb-6">"{review.quote}"</p>
                <p className="text-xs text-muted font-bold tracking-wider uppercase mt-auto">— {review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/texture_knit.png?v=2" alt="Background" className="w-full h-full object-cover brightness-50" />
        </div>
        <div className="relative z-10 container-site text-center text-white" data-reveal>
          <p className="text-sm font-bold tracking-widest uppercase text-white/70 mb-4 drop-shadow-md">New In</p>
          <h2 className="font-display text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg">
            Lowers, dropped.
          </h2>
          <p className="text-lg md:text-xl text-white/90 max-w-xl mx-auto mb-10 drop-shadow-md leading-relaxed">
            Cargos, wide-legs, and easy-fits. Styled for the street, designed for supreme comfort.
          </p>
          <Link to="/products?type=lower" className="btn-accent text-lg px-12 py-5 shadow-2xl hover:scale-105 transition-transform duration-300">
            Shop Lowers <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
