import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={(isHome ? '' : 'pt-14') + ' flex-1'}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}