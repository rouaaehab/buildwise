import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Users,
  Settings,
} from 'lucide-react';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { to: '/dashboard/client', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/bookings', label: 'My Bookings', icon: Calendar },
  { to: '/chat', label: 'Messages', icon: MessageSquare },
  { to: '/engineers', label: 'Browse Engineers', icon: Users },
  { to: '/dashboard/client#settings', label: 'Settings', icon: Settings },
];

export default function ClientDashboardLayout({
  profile,
  user,
  stats,
  topAction,
  children,
  rightSidebar,
}) {
  const location = useLocation();
  const unreadCount = useUnreadCount(user, location.pathname);
  const name = profile?.name || user?.email?.split('@')[0] || 'You';
  const initials = (profile?.name || user?.email || 'Y')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left sidebar */}
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white shadow-sm">
        <div className="flex h-full flex-col p-4">
          <Link
            to="/"
            className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="h-4 w-4" />
            </span>
            Buildwise
          </Link>

          <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border-2 border-white shadow">
                <AvatarImage alt={name} src={profile?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-sm font-medium text-gray-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{name}</p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
                {stats?.bookings != null && (
                  <p className="mt-0.5 text-xs font-medium text-gray-900">
                    {stats.bookings} booking{stats.bookings !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isHash = to.includes('#');
              return isHash ? (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              ) : (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                  {to === '/chat' && unreadCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main + right column */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Hello, {name.split(' ')[0]}
            </h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {topAction}
          </div>
        </header>

        <div className="flex flex-1 gap-6 p-6">
          <main className="min-w-0 flex-1">{children}</main>
          {rightSidebar && (
            <aside className="w-80 shrink-0 space-y-6">{rightSidebar}</aside>
          )}
        </div>
      </div>
    </div>
  );
}
