import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Star,
  Shield,
  ShieldCheck,
  Calendar,
  Settings,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { to: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/admin/bookings', label: 'Bookings', icon: Calendar },
  { to: '/dashboard/admin/users', label: 'Users', icon: Users },
  { to: '/dashboard/admin/admins', label: 'Admins', icon: ShieldCheck },
  { to: '/chat', label: 'Messages', icon: MessageCircle },
  { to: '/dashboard/admin/contact', label: 'Contact form', icon: Mail },
  { to: '/dashboard/admin#settings', label: 'Settings', icon: Settings },
];

export default function AdminDashboardLayout({
  profile,
  user,
  title,
  subtitle,
  children,
}) {
  const name = profile?.name || user?.email?.split('@')[0] || 'Admin';
  const initials = (profile?.name || user?.email || 'A')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white shadow-sm">
        <div className="flex h-full flex-col p-4">
          <Link
            to="/"
            className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-white">
              <Shield className="h-4 w-4" />
            </span>
            Buildwise
          </Link>

          <div className="mb-6 rounded-xl border border-gray-100 bg-slate-50/80 p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border-2 border-white shadow">
                <AvatarImage alt={name} src={profile?.avatar_url} />
                <AvatarFallback className="bg-slate-200 text-sm font-medium text-slate-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{name}</p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-600">Admin</p>
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
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{title ?? 'Admin dashboard'}</h1>
            <p className="text-sm text-gray-500">
              {subtitle ?? 'Manage users, engineers, and content'}
            </p>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View site
          </Link>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
