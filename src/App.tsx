import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import StaffScreen from './pages/StaffScreen';
import KitchenScreen from './pages/KitchenScreen';
import AdminScreen from './pages/AdminScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import InvoiceDetailScreen from './pages/InvoiceDetailScreen';

const queryClient = new QueryClient();

function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f3f4f6' }}>
      <h1 style={{ fontSize: '2.5rem', color: '#1f2937', marginBottom: '2rem' }}>Hệ Thống Quản Lý Gia Hưng Quán</h1>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/staff" style={buttonStyle('#3b82f6')}>Giao diện Phục Vụ</Link>
        <Link to="/kitchen" style={buttonStyle('#ef4444')}>Giao diện Nhà Bếp</Link>
        <Link to="/admin" style={buttonStyle('#8b5cf6')}>Quản Lý Quán (Menu/Bàn)</Link>
      </div>
    </div>
  );
}

const buttonStyle = (color: string) => ({
  backgroundColor: color,
  color: 'white',
  padding: '1rem 2rem',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: '1.2rem',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s',
  display: 'inline-block'
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminScreen />} />
          <Route path="/staff" element={<StaffScreen />} />
          <Route path="/invoice/:id" element={<InvoiceDetailScreen />} />
          <Route path="/kitchen" element={<KitchenScreen />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
