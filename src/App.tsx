import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { PositionDetail } from '@/pages/PositionDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/position/:ticker" element={<PositionDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
