import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { TabNav } from './TabNav';
import { usePortfolio } from '@/contexts/PortfolioContext';

export function AppLayout() {
  const { lastUpdated, refresh, quotesLoading, usingMock } = usePortfolio();

  return (
    <div className="min-h-screen bg-bg-primary text-slate-200">
      <Header
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        isLoading={quotesLoading}
        usingMock={usingMock}
      />
      <TabNav />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}

// Kept for backward compatibility with PositionDetail which uses its own layout
export function Layout({
  children,
  lastUpdated,
  onRefresh,
  isLoading,
  usingMock,
}: {
  children: React.ReactNode;
  lastUpdated: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
  usingMock: boolean;
}) {
  return (
    <div className="min-h-screen bg-bg-primary text-slate-200">
      <Header lastUpdated={lastUpdated} onRefresh={onRefresh} isLoading={isLoading} usingMock={usingMock} />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
