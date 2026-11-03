import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-muted">Chargement…</p>;
  return user ? <DashboardPage /> : <LoginPage />;
}
