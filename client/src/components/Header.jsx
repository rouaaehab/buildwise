import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadCount } from '../hooks/useUnreadCount';

const navLink =
  'text-sm text-white/90 hover:text-white focus-visible:text-white';

export default function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const unreadCount = useUnreadCount(user, location.pathname);

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-black/90 backdrop-blur-sm">
        <div className="flex h-full items-center justify-between px-4">
          <span className="text-white/60">Loading…</span>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between bg-black/90 backdrop-blur-sm border-b border-white/10">
      <Link to="/" className="text-xl font-bold text-white hover:text-white/90">
        Buildwise
      </Link>
      <nav className="flex items-center gap-4 flex-wrap">
        {user ? (
          <>
            {profile?.role === 'engineer' && (
              <Link to="/dashboard/engineer" className={navLink}>
                My dashboard
              </Link>
            )}
            {profile?.role === 'client' && (
              <Link to="/dashboard/client" className={navLink}>
                My dashboard
              </Link>
            )}
            {profile?.role === 'admin' && (
              <Link to="/dashboard/admin" className={navLink}>
                Admin
              </Link>
            )}
            <Link to="/bookings" className={navLink}>
              My bookings
            </Link>
            <Link to="/chat" className="relative inline-flex items-center gap-1.5">
              <span className={navLink}>Messages</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <span className="text-sm text-white/80">
              {profile?.name || user.email}{' '}
              <span className="text-white/60">({profile?.role})</span>
            </span>
            <button onClick={() => signOut()} className={navLink}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={navLink}>
              Log in
            </Link>
            <Link to="/signup" className={navLink}>
              Sign up
            </Link>
          </>
        )}
        <Link to="/engineers" className={navLink}>
          Browse engineers
        </Link>
      </nav>
    </header>
  );
}
