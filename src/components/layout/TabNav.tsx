import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  TableProperties,
  TrendingUp,
  PieChart,
  Scale,
  CalendarDays,
  Star,
  BookOpen,
} from 'lucide-react';

const TABS = [
  { path: '/overview', label: 'Overview', Icon: LayoutDashboard },
  { path: '/holdings', label: 'Holdings', Icon: TableProperties },
  { path: '/performance', label: 'Performance', Icon: TrendingUp },
  { path: '/allocation', label: 'Allocation', Icon: PieChart },
  { path: '/valuation', label: 'Valuation', Icon: Scale },
  { path: '/earnings', label: 'Earnings', Icon: CalendarDays },
  { path: '/watchlist', label: 'Watchlist', Icon: Star },
  { path: '/journal', label: 'Journal', Icon: BookOpen },
] as const;

export function TabNav() {
  return (
    <nav className="border-b border-border bg-bg-primary/80 backdrop-blur-sm sticky top-14 z-30">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
          {TABS.map(({ path, label, Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-border-bright'
                )
              }
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
