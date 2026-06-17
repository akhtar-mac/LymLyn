import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Header />
      <main className={`flex-1 ${!isHome ? 'pt-20 md:pt-24' : ''}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
