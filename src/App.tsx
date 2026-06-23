import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PortfolioProvider } from '@/contexts/PortfolioContext';
import { AppLayout } from '@/components/layout/Layout';
import { PositionDetail } from '@/pages/PositionDetail';
import { OverviewPage } from '@/pages/OverviewPage';
import { HoldingsPage } from '@/pages/HoldingsPage';
import { PerformancePage } from '@/pages/PerformancePage';
import { AllocationPage } from '@/pages/AllocationPage';
import { ValuationPage } from '@/pages/ValuationPage';
import { EarningsPage } from '@/pages/EarningsPage';
import { WatchlistPage } from '@/pages/WatchlistPage';
import { JournalPage } from '@/pages/JournalPage';

export default function App() {
  return (
    <BrowserRouter>
      <PortfolioProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route element={<AppLayout />}>
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/holdings" element={<HoldingsPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/allocation" element={<AllocationPage />} />
            <Route path="/valuation" element={<ValuationPage />} />
            <Route path="/earnings" element={<EarningsPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/journal" element={<JournalPage />} />
          </Route>
          <Route path="/position/:ticker" element={<PositionDetail />} />
        </Routes>
      </PortfolioProvider>
    </BrowserRouter>
  );
}
