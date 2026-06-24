import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StaffScreen from './pages/StaffScreen';
import KitchenScreen from './pages/KitchenScreen';
import AdminScreen from './pages/AdminScreen';
import RevenueScreen from './pages/RevenueScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import InvoiceDetailScreen from './pages/InvoiceDetailScreen';
import LoginScreen from './pages/login/LoginScreen';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './ui/Notification/NotificationContext';

import HomeScreen from './pages/home/HomeScreen';
import ScrollToTop from './components/ScrollToTop';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<LoginScreen />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/home" element={<HomeScreen />} />
              <Route path="/admin" element={<AdminScreen />} />
              <Route path="/revenue" element={<RevenueScreen />} />
              <Route path="/staff" element={<StaffScreen />} />
              <Route path="/invoice/:id" element={<InvoiceDetailScreen />} />
              <Route path="/kitchen" element={<KitchenScreen />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;
