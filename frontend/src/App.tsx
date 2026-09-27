import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import ResourceDetail from './pages/ResourceDetail';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import InviteRegister from './pages/InviteRegister';
import Login from './pages/Login';
import PasswordReset from './pages/PasswordReset';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/browse/:faculty" element={<Browse />} />
            <Route path="/browse/:faculty/:department" element={<Browse />} />
            <Route path="/resource/:id" element={<ResourceDetail />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
            <Route path="/invite/:token" element={<InviteRegister />} />
            <Route path="/reset/:token" element={<PasswordReset />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
