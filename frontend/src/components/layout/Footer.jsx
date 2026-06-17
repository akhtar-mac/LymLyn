import { Link } from 'react-router-dom';
import { Share2, ExternalLink } from 'lucide-react';


export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-white mt-auto">
      <div className="container-site py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <img src="/logo.svg" alt="LYM|LYN" className="h-10 md:h-12 object-contain" />
            </div>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              Premium essentials built to last. T-shirts and lowers made for the everyday — try it on before it arrives.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" aria-label="Instagram" className="text-white/40 hover:text-accent transition-colors">
                <Share2 size={20} />
              </a>
              <a href="#" aria-label="Twitter" className="text-white/40 hover:text-accent transition-colors">
                <ExternalLink size={20} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-white/40 mb-4">Shop</p>
            <ul className="space-y-3">
              {[
                { label: 'T-Shirts', to: '/products?type=tshirt' },
                { label: 'Lowers', to: '/products?type=lower' },
                { label: 'All Products', to: '/products' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-white/60 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-white/40 mb-4">Info</p>
            <ul className="space-y-3">
              {[
                { label: 'About', to: '/about' },
                { label: 'Returns', to: '/returns' },
                { label: 'Privacy Policy', to: '/privacy' },
                { label: 'Terms', to: '/terms' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-white/60 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider mt-12 border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/30">
          <p>© {year} LYM|LYN. All rights reserved.</p>
          <p>Made with intent. Worn with confidence.</p>
        </div>
      </div>
    </footer>
  );
}
