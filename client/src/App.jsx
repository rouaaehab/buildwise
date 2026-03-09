import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EngineerDashboard from './pages/EngineerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import BrowseEngineers from './pages/BrowseEngineers';
import EngineerProfile from './pages/EngineerProfile';
import Bookings from './pages/Bookings';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminAdmins from './pages/AdminAdmins';
import AdminBookings from './pages/AdminBookings';
import AdminContact from './pages/AdminContact';
import Chat from './pages/Chat';
import ChatThread from './pages/ChatThread';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard/engineer" element={<EngineerDashboard />} />
            <Route path="/dashboard/client" element={<ClientDashboard />} />
            <Route path="/engineers" element={<BrowseEngineers />} />
            <Route path="/engineers/:id" element={<EngineerProfile />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:userId" element={<ChatThread />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/admin/bookings" element={<AdminBookings />} />
            <Route path="/dashboard/admin/users" element={<AdminUsers />} />
            <Route path="/dashboard/admin/admins" element={<AdminAdmins />} />
            <Route path="/dashboard/admin/contact" element={<AdminContact />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
