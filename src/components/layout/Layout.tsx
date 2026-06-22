import type { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  lastUpdated: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
  usingMock: boolean;
}

export function Layout({ children, lastUpdated, onRefresh, isLoading, usingMock }: LayoutProps) {
  return (
    <div className="min-h-screen bg-bg-primary text-slate-200">
      <Header
        lastUpdated={lastUpdated}
        onRefresh={onRefresh}
        isLoading={isLoading}
        usingMock={usingMock}
      />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
