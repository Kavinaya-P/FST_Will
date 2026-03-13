import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem('ev_admin_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}
